export const INTEGRATION_TYPE = {
  MAILCHIMP: "MAILCHIMP",
  SUBSTACK: "SUBSTACK",
} as const;

export const INTEGRATION_FLOW: Record<string, Record<string, string>> = {
  [INTEGRATION_TYPE.MAILCHIMP]: {
    LOGIN: "login",
    TOTP: "totp",
    SELECT_LIST: "select-list",
    EXTRACT_DATA: "extract-data",
  },
  [INTEGRATION_TYPE.SUBSTACK]: {
    LOGIN: "login",
    AUTH_LINK: "auth-link",
    SELECT_LIST: "select-list",
    EXTRACT_DATA: "extract-data",
  },
};
