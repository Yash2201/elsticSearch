import * as elasticSearchService from './elastic-search.service.js'

export const getLeadsByLinkedinUrl = async (req, res) => {
  const { linkedin_url } = req.query;
  if (!linkedin_url) {
    res.status(500).json({
      message: 'Request params not found'
    });
  }

  try {
    let lead_data = await elasticSearchService.getLeadsByLinkedinUrl(linkedin_url);
    res.status(200).json(lead_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
}

export const getProfilesByCountry = async (req, res) => {
  try {
    let lead_data = await elasticSearchService.getProfilesGroupedByCountry();

    console.log('Lead data:', lead_data);

    res.status(200).json(lead_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

export const getProfilesCountByCountry = async (req, res) => {
  try {
    let lead_data = await elasticSearchService.getProfilesCountByCountry();

    console.log('Lead data:', lead_data);

    res.status(200).json(lead_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

export const getDataByCountry = async (req, res) => {
  const country = req.query.country;

  console.log('Country:', country);

  if (!country) {
    res.status(500).json({
      message: 'Request params not found'
    });
  }

  try {
    let lead_data = await elasticSearchService.getCountryDataAsCSV(country);

    console.log('Lead data:', lead_data);

    res.status(200).json(lead_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
}

export const getProfilesByCountryAndSkill = async (req, res) => {
  const { country } = req.query;
  if (!country) {
    return res.status(400).json({ message: 'Country is required' });
  }

  try {
    const totalRecords = await elasticSearchService.getProfilesByCountryAndSkill(country);
    res.status(200).json({ message: `Total records processed: ${totalRecords}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const getCompanyLocations = async (req, res) => {
  try {
    const filePath = await elasticSearchService.getCompanyLocations();
    res.status(200).json({ message: "CSV file created", path: filePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

export const getCampusHiringManagers = async (req, res) => {
  try {
    const filePath = await elasticSearchService.getCampusHiringManagers();
    res.status(200).json({
      message: 'Campus Hiring Managers data exported successfully',
      filePath: filePath
    });
  } catch (error) {
    console.error('Error fetching campus hiring managers:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};