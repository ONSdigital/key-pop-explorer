# key-pop-explorer

Next iteration of [this app](https://github.com/bothness/sub-profile), re-coded using SvelteKit.

## Methodology

The data is from the [ONS API](https://developer.ons.gov.uk/).

An example of the file format: Suppose you have selected age 16-64 and born in Ireland. The data is served to the web-app in a JSON file called `2var/country_of_birth_8a-2/resident_age_3a.json` (The `2` in the file name indicates that the second category for country of birth has been chosen.)

This file contains a JSON object of counts for each of the charts. For example, for `sex` we have `{ 1: 84937, 2: 76848 }`: 84937 females and 76848 males. The percentages shown - 52.5 and 47.5 are calculated in the browser, with the sum across all categories used as the denominator. Rounding is carried out using `.toFixed()` in JavaScript.

For each lower tier local authority (LTLA), the map shows the percentage of people in that LTLA that are in the selected category. We again calcuate the percentage in the browser using JavaScript. The numerator is the number of people in the selected group (age 16-64 and born in Ireland). The denominator is the total of the male and female counts for that LTLA.

## Selections for testing

The following URLs include some edge-case selections. These might be useful for testing.

- No data available: http://localhost:5173/?country_of_birth_8a=3&main_language_23a=16&national_identity_all_9a=4
- Population around 3000, four charts missing, most data missing from map: http://localhost:5173/?country_of_birth_8a=3&main_language_23a=16&national_identity_all_9a=4
- Population less than 100: http://localhost:5173/?main_language_11a=1&english_proficiency=5
- Age filtered: http://localhost:5173/?main_language_11a=1&resident_age_3a=2
