export const query = {
  "query": {
    "bool": {
      "must": [
        {
          "bool": {
            "should": [
              {
                "wildcard": {
                  "organization.industries.keyword": "*Tech*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*venture capital*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Hedge funds*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Private equity firms*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Business development companies (BDCs)*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Government grants and loans*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Angel investors*"
                }
              },
              {
                "wildcard": {
                  "organization.industries.keyword": "*Investment banks*"
                }
              }
            ],
            "minimum_should_match": 1
          }
        }
      ],
      "must_not": [
        {
          "bool": {
            "should": [
              {
                "wildcard": {
                  "country.keyword": "*US*"
                }
              },
              {
                "wildcard": {
                  "country.keyword": "*USA*"
                }
              },
              {
                "wildcard": {
                  "country.keyword": "*United States*"
                }
              }
            ],
            "minimum_should_match": 1
          }
        }
      ]
    }
  },
  "size": 100
}
export const columns = [
"name",
"email",
"phone_numbers_1_raw_number",
"country",
"city",
];
export const index = "people";
export const filename = "tech+vcData";
export const nested = false;
export const allColumns = false;


// In Side the US,USA, United State :

// {
//   "query": {
//     "bool": {
//       "must": [
//         {
//           "bool": {
//             "should": [
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Tech*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*venture capital*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Hedge funds*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Private equity firms*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Business development companies (BDCs)*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Government grants and loans*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Angel investors*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Investment banks*"
//                 }
//               }
//             ],
//             "minimum_should_match": 1
//           }
//         },
//         {
//           "bool": {
//             "should": [
//               {
//                 "wildcard": {
//                   "country.keyword": "*US*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "country.keyword": "*USA*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "country.keyword": "*United States*"
//                 }
//               }
//             ],
//             "minimum_should_match": 1
//           }
//         }
//       ]
//     }
//   }
// }


// Not in Us
// {
//   "query": {
//     "bool": {
//       "must": [
//         {
//           "bool": {
//             "should": [
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Tech*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*venture capital*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Hedge funds*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Private equity firms*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Business development companies (BDCs)*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Government grants and loans*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Angel investors*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "organization.industries.keyword": "*Investment banks*"
//                 }
//               }
//             ],
//             "minimum_should_match": 1
//           }
//         }
//       ],
//       "must_not": [
//         {
//           "bool": {
//             "should": [
//               {
//                 "wildcard": {
//                   "country.keyword": "*US*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "country.keyword": "*USA*"
//                 }
//               },
//               {
//                 "wildcard": {
//                   "country.keyword": "*United States*"
//                 }
//               }
//             ],
//             "minimum_should_match": 1
//           }
//         }
//       ]
//     }
//   }
// }