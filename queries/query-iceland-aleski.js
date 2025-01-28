
export const query = {
  query: {
    bool: {
      must: [
        {
          bool: {
            should: [
              { term: { "country.keyword": "Iceland" } }
            ],
            minimum_should_match: 1
          }
        }
      ]
    }
  }
  ,size: 10000
};
  
export const columns = [
    "id",
    "first_name",
    "last_name",
    "name",
    "linkedin_url",
    "title",
    "email_status",
    "email",
    "city",
    "country",
    "organization_name",
    "organization_website_url",
    "organization_linkedin_url",
    "organization_primary_domain",
    "organization_industry",
    "organization_estimated_num_employees"
];
  
export const index = "people";
export const filename = "iceland";
export const nested = false;
export const allColumns = false;