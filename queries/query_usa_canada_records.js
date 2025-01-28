export const query ={
  "query": {
    "bool": {
      "must": [
        {
          "bool": {
            "should": [
              {
                "wildcard": {
                  "organization.industries.keyword": "*venture capital*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*private equity*"
                }
              },
              {
                "wildcard": {
                  "title.keyword": "*Founder*"
                }
              },
              {
                "wildcard": {
                  "title.keyword": "*Co-Founder*"
                }
              }
            ],
            "minimum_should_match": 1
          }
        },
        {
          "bool": {
            "should": [
              {
                "wildcard": {
                  "country.keyword": "*United States*"
                }
              },
              {
                "wildcard": {
                  "country.keyword": "*Canada*"
                }
              }
            ],
            "minimum_should_match": 1
          }
        }
      ]
    }
  },
  size: 300
}

export const columns = [
    "name",
    "title",
    "country",
    "organization_name",
    "employment_history",
    "education",
    "email",
    "linkedin_url"
];
  
export const index = "people";
export const filename = "usa_canada_records";
export const nested = false;
export const allColumns = false;