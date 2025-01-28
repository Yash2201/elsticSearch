import { Router } from "express";
import axios from "axios";
import { Parser } from "json2csv";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { columns, query, index, filename, nested, allColumns } from "./queries/query_test.js";
const router = Router();

async function saveBatchToCSV(hits, fileIndex, folderPath, totalRecords,scrollId,scrollStateFile) {
  console.log(`Processing batch ${fileIndex}...`);
  let dataToSave;
  let json2csvParser;
  if (nested) {
    dataToSave = hits;
  } else {
    dataToSave = flattenData(hits);
  }
  if (allColumns) {
    json2csvParser = new Parser();
  } else {
    json2csvParser = new Parser({ fields: columns });
  }
  const csv = json2csvParser.parse(dataToSave);

  // Save CSV to a file with unique index
  const filePath = resolve(folderPath, `${filename}_data_${fileIndex}.csv`);
  writeFileSync(filePath, csv);
  console.log(`Batch file created at: ${filePath}`);
  console.log(`Records exported till now: ${totalRecords + hits.length}`);

  // Save the last record sort value
  const lastRecord = hits[hits.length - 1];
  if (lastRecord) {
    const lastRecordData = {
      scrollId:scrollId,
      fileIndex:fileIndex,
      totalRecords: totalRecords + hits.length
    }
    writeFileSync(scrollStateFile, JSON.stringify(lastRecordData), "utf8");
  }
}

// Retry logic for shard failures
async function executeWithRetry(fn, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.type === "search_phase_execution_exception"
      ) {
        console.error("Shard failure occurred. Retrying...");
        attempts++;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached. Query failed.");
}

function flattenData(data) {
  const flattenedData = [];
  data.forEach((record) => {
    const flattenedRecord = {};
    function flatten(item, prefix = "") {
      Object.keys(item).forEach((key) => {
        const value = item[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (Array.isArray(value)) {
          if (typeof value[0] === "object" && value[0] !== null) {
            value.forEach((subItem, i) => flatten(subItem, `${newKey}_${i + 1}`));
          } else {
            flattenedRecord[newKey] = value.join(", ");
          }
        } else if (typeof value === "object" && value !== null) {
          flatten(value, newKey);
        } else {
          flattenedRecord[newKey] = value;
        }
      });
    }
    flatten(record);
    flattenedData.push(flattenedRecord);
  });
  return flattenedData;
}

router.get("/getdata", async (req, res) => {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  let scrollId = null;
  let totalRecords = 0;
  let fileIndex = 1;
  
  // Create folder for country-specific data
  const folderPath = resolve(`./data/${filename}`);

  // Check if there is a last record sort value saved
  const scrollStateFile = resolve(folderPath, 'last_record_id.json');

  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
    console.log(`creation of file with this details `,scrollStateFile);
    writeFileSync(scrollStateFile, '{}', 'utf8');
  }
  console.log("folderPath -->> ",folderPath);
  
  console.log("scrollStateFile -->> ",scrollStateFile);
  console.log("existsSync(scrollStateFile) -->> ",existsSync(scrollStateFile));
  if (existsSync(scrollStateFile)) {
    const savedState = JSON.parse(readFileSync(scrollStateFile, "utf8"));
    scrollId = savedState.scrollId ?? null;
    fileIndex = savedState.fileIndex ?? 1;
    totalRecords = savedState.totalRecords ?? 0;
    console.log(`Resuming from batch: ${fileIndex}, total records: ${totalRecords}`);
  }
  console.log("before loading the initialQueryBody search...");
  
  // Initialize the search query with the specified country
  const initialQueryBody = query;

  let initialConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${url}${index}/_search?scroll=1m`,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Authorization: `ApiKey ${apiKey}`,
    },
    data: JSON.stringify(initialQueryBody),
  };
  
  if(scrollId){
    initialConfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${url}_search/scroll?scroll=1m`,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Authorization: `ApiKey ${apiKey}`,
      },
      data: JSON.stringify({ scroll_id: scrollId }),
    };
  }
  try {
    console.log("Fetching data from ElasticSearch...");
    const initialResponse = await executeWithRetry(() => axios(initialConfig));
   
    let hits = initialResponse.data.hits.hits.map((hit) => hit._source);
    console.log(`Initial batch size: ${hits.length}`);
    scrollId = initialResponse.data._scroll_id;
   
    // Save the first batch
    await saveBatchToCSV(hits, fileIndex ?? 1, folderPath, totalRecords,scrollId,scrollStateFile);
    totalRecords += hits.length;
    fileIndex++;
   
    // Scroll through remaining results
    while (scrollId) {
      const scrollConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${url}_search/scroll?scroll=1m`,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Authorization: `ApiKey ${apiKey}`,
        },
        data: JSON.stringify({ scroll_id: scrollId }),
      };
      const scrollResponse = await executeWithRetry(() => axios(scrollConfig));
      const { hits: scrollHits, _scroll_id } = scrollResponse.data;
      if (scrollHits.hits.length === 0) {
        scrollId = null;
        break;
      }
      // Save the current batch
      hits = scrollHits.hits.map((hit) => hit._source);
      await saveBatchToCSV(hits, fileIndex ?? 1, folderPath, totalRecords,scrollId,scrollStateFile  );
      totalRecords += hits.length;
      fileIndex++;
      scrollId = _scroll_id;
    }
    console.log(`Total records processed: ${totalRecords}`);
    res.send(`Data fetched successfully. Total records: ${totalRecords}`);
  }
  catch (error) {
    if (error.response) {
      console.error("Response error:",error.response.status,error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    res.status(500).send("Error fetching data");
  }
});
export default router;