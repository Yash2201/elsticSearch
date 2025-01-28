import axios from "axios";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";

export async function getProfilesGroupedByCountry() {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  // Query body without filtering for a specific country
  const queryBody = {
    size: 0,  // Only return aggregation results, not individual documents
    aggs: {
      profiles_by_country: {
        terms: {
          field: "country.keyword",
          size: 1000 // Adjust this to handle more countries if needed
        },
        aggs: {
          profile_with_phones: {
            terms: {
              field: "phone_numbers.raw_number.keyword",
              size: 100 // Set the maximum number of phone numbers per country
            }
          },
          profile_with_emails: {
            terms: {
              field: "personal_emails.keyword",
              size: 100 // Set the maximum number of emails per country
            }
          }
        }
      }
    }
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${url}/people/_search`,  // Use the people index
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Authorization": `ApiKey ${apiKey}`,
    },
    data: JSON.stringify(queryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password,
      },
      protocol: proxyAgent.protocol
    },
  };

  try {
    const response = await axios(config);

    // Process the aggregation results
    const buckets = response.data.aggregations?.profiles_by_country.buckets || [];
    const result = buckets.map(bucket => ({
      country: bucket.key,
      profile_with_phones: bucket.profile_with_phones.buckets.map(b => b.key),
      profile_with_emails: bucket.profile_with_emails.buckets.map(b => b.key),
    }));

    return result;
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error;
  }
}

export async function getProfilesCountByCountry() {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  // Query body for counts of profile_with_phones and profile_with_emails by country
  const queryBody = {
    size: 0,  // Only return aggregation results
    aggs: {
      profiles_by_country: {
        terms: {
          field: "country.keyword",
          size: 1000 // Adjust this if you have more than 1000 countries
        },
        aggs: {
          phone_count: {
            cardinality: {
              field: "phone_numbers.raw_number.keyword"
            }
          },
          email_count: {
            cardinality: {
              field: "personal_emails.keyword"
            }
          }
        }
      }
    }
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${url}/people/_search`,  // Use the people index
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Authorization": `ApiKey ${apiKey}`,
    },
    data: JSON.stringify(queryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password,
      },
      protocol: proxyAgent.protocol
    },
  };

  try {
    const response = await axios(config);
    console.log('Response:', response.data);

    // Process the aggregation results
    const buckets = response.data.aggregations?.profiles_by_country.buckets || [];
    const result = buckets.map(bucket => ({
      country: bucket.key,
      profile_with_phones_count: bucket.phone_count.value,
      profile_with_emails_count: bucket.email_count.value,
    }));

    return result;
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error;
  }
}

// Export data for a specific country as a CSV file
export async function getCountryDataAsCSV(country) {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  let scrollId = null;
  let totalRecords = 0;
  let fileIndex = 1;
  const batchSize = 10000; // Set to 10k (ES limit)

  // Create folder for country-specific data
  const folderPath = path.resolve(`./countrydata/${country}`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Initialize the scroll query with the specified country
  // const initialQueryBody = {
  //   "query": {
  //     "bool": {
  //       "must": [
  //         { "match": { "country": "United States" } },
  //         {
  //           "bool": {
  //             "should": [
  //               { "match_phrase": { "title": "Owner" } },
  //               { "match_phrase": { "title": "Manager" } },
  //               { "match_phrase": { "title": "Property Manager" } },
  //               { "match_phrase": { "title": "Real Estate" } },
  //               { "match_phrase": { "title": "Landlord" } },
  //               { "match_phrase": { "title": "Estate Manager" } }
  //             ]
  //           }
  //         }
  //       ]
  //     }
  //   },
  //   size: batchSize,
  // };

  const initialQueryBody = {
    "query": {
      "bool": {
        "must": [
          { "match": { "country": "United States" } },
          {
            "bool": {
              "should": [
                { "wildcard": { "title": "*Owner*" } },
                { "wildcard": { "title": "*Manager*" } },
                { "wildcard": { "title": "*Property Manager*" } },
                { "wildcard": { "title": "*Real Estate*" } }
              ]
            }
          }
        ]
      }
    },
    "aggs": {
      "locations": {
        "terms": {
          "field": "city.keyword",
          "size": 1000
        }
      }
    },
    "size": 0
  }


  const initialConfig = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${url}/people2/_search?scroll=1m`,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Authorization": `ApiKey ${apiKey}`
    },
    data: JSON.stringify(initialQueryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password
      },
      protocol: proxyAgent.protocol
    }
  };

  async function saveBatchToCSV(hits, fileIndex) {
    const flattenedData = flattenData(hits);

    const columns = [
      'first_name',
      'last_name',
      'name',
      'linkedin_url',
      'title',
      'email_status',
      'email',
      'city',
      'country',
      'organization_name',
      'organization_website_url',
      'organization_linkedin_url',
      'organization_primary_domain',
      'organization_industry',
      'organization_estimated_num_employees'
    ];

    const json2csvParser = new Parser({ fields: columns });
    const csv = json2csvParser.parse(flattenedData);

    // Save CSV to a file with unique index
    const filePath = path.resolve(folderPath, `${country}_data_${fileIndex}.csv`);
    fs.writeFileSync(filePath, csv);
    console.log(`Batch file created at: ${filePath}`);
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
          error.response.data.error.type === 'search_phase_execution_exception'
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

  try {
    const initialResponse = await executeWithRetry(() => axios(initialConfig));
    let hits = initialResponse.data.hits.hits.map(hit => hit._source);
    scrollId = initialResponse.data._scroll_id;

    // Save the first batch
    await saveBatchToCSV(hits, fileIndex);
    totalRecords += hits.length;
    fileIndex++;

    // Scroll through remaining results
    while (scrollId) {
      const scrollConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${url}/_search/scroll?scroll=1m`,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Authorization": `ApiKey ${apiKey}`
        },
        data: JSON.stringify({ scroll_id: scrollId })
      };

      const scrollResponse = await executeWithRetry(() => axios(scrollConfig));
      const { hits: scrollHits, _scroll_id } = scrollResponse.data;

      if (scrollHits.hits.length === 0) {
        scrollId = null;
        break;
      }

      // Save the current batch
      hits = scrollHits.hits.map(hit => hit._source);
      await saveBatchToCSV(hits, fileIndex);

      totalRecords += hits.length;
      fileIndex++;
      scrollId = _scroll_id;
    }

    console.log(`Total records processed: ${totalRecords}`);
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error;
  }

  return totalRecords;
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
export async function getProfilesByCountryAndSkill(country) {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  let scrollId = null;
  let totalRecords = 0;
  let fileIndex = 1;
  const batchSize = 10000; // 10k records per file

  const folderPath = path.resolve(`./countrydata/${country}_Accountancy`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const initialQueryBody = {
    query: {
      bool: {
        must: [
          { match: { "country.keyword": country } },
          {
            bool: {
              should: [
                { match: { "functions": "Accountancy" } },
                { match: { "title": "Accountancy" } },
                { match: { "organization.industry": "Accountancy" } },
                { match: { "employment_history.title": "Accountancy" } },
                { match: { "employment_history.organization_name": "Accountancy" } },
                { match: { "headline": "Accountancy" } },
                { match: { "employment_history.description": "Accountancy" } },
                { match: { "organization.primary_domain": "Accountancy" } },
                { match: { "organization.keywords": "Accountancy" } },
                { match: { "skills": "Accountancy" } },
                { match: { "departments": "Accountancy" } },
                { match: { "subdepartments": "Accountancy" } }
              ],
              minimum_should_match: 1
            }
          }
        ]
      }
    },
    size: batchSize
  };


  const initialConfig = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${url}/people2/_search?scroll=1m`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${apiKey}`
    },
    data: JSON.stringify(initialQueryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password,
      },
      protocol: proxyAgent.protocol,
    },
  };

  async function saveBatchToCSV(hits, fileIndex) {
    const flattenedData = flattenData(hits);

    const columns = [
      'id', 'first_name', 'last_name', 'name', 'linkedin_url', 'title',
      'email_status', 'photo_url', 'twitter_url', 'github_url', 'facebook_url',
      'extrapolated_email_confidence', 'headline', 'email', 'state', 'city',
      'country', 'is_likely_to_engage', 'intent_strength', 'show_intent',
      'organization_id', 'organization_name', 'organization_website',
      'organization_phone', 'organization_city', 'organization_country',
      'organization_linkedin', 'organization_founded_year', 'organization_industry',
      'employment_current', 'employment_title', 'employment_organization_name',
      'employment_start_date', 'employment_end_date', 'phone_number'
    ];

    const json2csvParser = new Parser({ fields: columns });
    const csv = json2csvParser.parse(flattenedData);

    const filePath = path.resolve(folderPath, `${country}_Accountancy_data_${fileIndex}.csv`);
    fs.writeFileSync(filePath, csv);
    console.log(`Batch file created at: ${filePath}`);
  }

  try {
    const initialResponse = await axios(initialConfig);
    let hits = initialResponse.data.hits.hits.map(hit => hit._source);
    scrollId = initialResponse.data._scroll_id;

    await saveBatchToCSV(hits, fileIndex);
    totalRecords += hits.length;
    fileIndex++;

    while (scrollId) {
      const scrollConfig = {
        method: 'post',
        url: `${url}/_search/scroll?scroll=1m`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${apiKey}`
        },
        data: JSON.stringify({ scroll_id: scrollId }),
      };

      const scrollResponse = await axios(scrollConfig);
      const scrollHits = scrollResponse.data.hits.hits.map(hit => hit._source);
      if (scrollHits.length === 0) {
        scrollId = null;
        break;
      }

      await saveBatchToCSV(scrollHits, fileIndex);
      totalRecords += scrollHits.length;
      fileIndex++;
      scrollId = scrollResponse.data._scroll_id;
    }

    console.log(`Total records processed: ${totalRecords}`);
  } catch (error) {
    console.error('Error fetching records:', error.message);
    throw error;
  }

  return totalRecords;
}

export async function getLocationsForPropertyManagersAndExportCSV() {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  const queryBody = {
    query: {
      bool: {
        must: [
          { match: { "country.keyword": "United States" } },
          {
            bool: {
              should: [
                { match_phrase: { "title": "*Property Manager*" } },
                { match_phrase: { "title": "*Property Owner*" } },
                { match_phrase: { "title": "*Real Estate Manager*" } },
                { match_phrase: { "title": "*Landlord*" } },
                { match_phrase: { "title": "*Estate Manager*" } }
              ]
            }
          }
        ]
      }
    },
    aggs: {
      locations: {
        terms: {
          field: "city.keyword",
          size: 1000 // Adjust to handle the number of unique cities
        },
        aggs: {
          titles: {
            terms: {
              field: "title.keyword",
              size: 10 // Limit number of unique titles per city
            }
          }
        }
      }
    },
    size: 0 // Only return aggregation results
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${url}/people2/_search`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${apiKey}`,
    },
    data: JSON.stringify(queryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password,
      },
      protocol: proxyAgent.protocol
    }
  };

  try {
    const response = await axios(config);

    // Process the aggregation results
    const buckets = response.data.aggregations?.locations?.buckets || [];
    const data = [];

    buckets.forEach(bucket => {
      const city = bucket.key;
      const titles = bucket.titles.buckets;

      titles.forEach(titleBucket => {
        data.push({
          city: city,
          title: titleBucket.key,
          count: titleBucket.doc_count
        });
      });
    });

    // Export data to CSV
    const fields = ["city", "title", "count"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    const filePath = path.resolve(`./property_managers_owners_with_counts.csv`);
    fs.writeFileSync(filePath, csv);

    console.log(`CSV file created successfully at: ${filePath}`);
    return filePath;
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error;
  }
}

export async function getCompanyLocations() {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;
  const proxyAgent = getRandomProxy();

  const queryBody = {
    size: 0, // Aggregation only, no hits returned
    aggs: {
      companies: {
        terms: {
          field: "name.keyword", // Company name
          size: 10000 // Adjust for the number of companies
        },
        aggs: {
          location_count: {
            cardinality: {
              field: "street_address.keyword" // Count unique street addresses
            }
          }
        }
      }
    }
  };

  const config = {
    method: 'post',
    url: `${url}/companies3/_search`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${apiKey}`
    },
    data: JSON.stringify(queryBody),
    proxy: {
      host: proxyAgent.host,
      port: proxyAgent.port,
      auth: {
        username: proxyAgent.auth.username,
        password: proxyAgent.auth.password
      },
      protocol: proxyAgent.protocol
    }
  };

  try {
    const response = await axios(config);

    // Process the results
    const buckets = response.data.aggregations?.companies?.buckets || [];
    const data = buckets.map(bucket => ({
      company: bucket.key,
      location_count: bucket.location_count.value
    }));

    // Export to CSV
    const fields = ["company", "location_count"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    const filePath = path.resolve('./company_locations.csv');
    fs.writeFileSync(filePath, csv);

    console.log(`CSV file created successfully at: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error fetching company locations:', error.message);
    throw error;
  }
}

export async function getCampusHiringManagers() {
  const apiKey = process.env.ELASTIC_SEARCH_API_KEY;
  const url = process.env.ELASTIC_SEARCH_URL;

  const queryBody = {
    query: {
      bool: {
        must: [
          { match: { "country.keyword": "India" } },
          {
            bool: {
              should: [
                { wildcard: { "title.keyword": "*Campus Recruiter*" } },
                { wildcard: { "title.keyword": "*Hiring Manager*" } },
                { wildcard: { "title.keyword": "*Recruiter*" } }
              ]
            }
          },
          {
            terms: {
              "city.keyword": ["Pune", "Mumbai", "Hyderabad", "Bangalore"]
            }
          }
        ],
        filter: [
          { term: { "organization.industry.keyword": "Software Development" } }
        ]
      }
    },
    size: 10000,
    _source: [
      "first_name",
      "last_name",
      "title",
      "email",
      "city",
      "country",
      "organization.name",
      "organization.industry"
    ]
  };

  const config = {
    method: 'post',
    url: `${url}/people2/_search`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${apiKey}`
    },
    data: JSON.stringify(queryBody)
  };

  try {
    const response = await axios(config);
    const results = response.data.hits.hits.map(hit => hit._source);

    const fields = [
      "first_name",
      "last_name",
      "title",
      "email",
      "city",
      "country",
      "organization.name",
      "organization.industry"
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(results);

    const filePath = path.resolve('./campus_hiring_managers.csv');
    fs.writeFileSync(filePath, csv);

    console.log(`CSV file created at: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error fetching campus hiring managers:', error.message);
    throw error;
  }
}