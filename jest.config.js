const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");
module.exports = {
  ...jestConfig,
  moduleNameMapper: {
    "^c/group$": "<rootDir>/force-app/test/jest-mocks/c/group",
    "^c/groupMember$": "<rootDir>/force-app/test/jest-mocks/c/groupMember",
    "^c/lookup$": "<rootDir>/force-app/test/jest-mocks/c/lookup",
    "^c/lookupOption$": "<rootDir>/force-app/test/jest-mocks/c/lookupOption"
  }
};
