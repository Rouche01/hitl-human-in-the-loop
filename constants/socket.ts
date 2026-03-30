const NEWSLETTER_INTEGRATION_NAMESPACE = "/newsletter-integration";

// socket events
const NW_INTEGRATION_JOIN = "nw_integration::join";
const NW_INTEGRATION_AUTH = "nw_integration::auth";
const NW_INTEGRATION_AUTH_OTP_REQ = "nw_integration::auth_otp_request";
const NW_INTEGRATION_AUTH_OTP_RES = "nw_integration::auth_otp_response";
const NW_INTEGRATION_AUDIENCE_LIST = "nw_integration::audience_list";
const NW_INTEGRATION_SELECT_AUDIENCE = "nw_integration::select_audience";
const NW_INTEGRATION_CONNECTION_ERR = "nw_integration::connection_error";
const NW_INTEGRATION_INSTANCE_STATUS = "nw_integration::instance_status";
const NW_INTEGRATION_AUTH_ERROR = "nw_integration::auth_error";
const NW_INTEGRATION_GENERIC_ERROR = "nw_integration::generic_error";
const NW_INTEGRATION_AUTH_SUCCESS = "nw_integration::auth_success";
const NW_INTEGRATION_FETCH_AUDIENCE_LIST =
  "nw_integration::fetch_audience_list";
const NW_INTEGRATION_AUTH_EMAIL_SENT = "nw_integration::auth_email_sent";
const NW_INTEGRATION_AUTH_LINK_REQ = "nw_integration::auth_link_request";
const NW_INTEGRATION_AUDIENCE_CONNECTED = "nw_integration::audience_connected";
const NW_INTEGRATION_TERMINATE_PROCESS = "nw_integration::terminate_process";
const NW_INTEGRATION_PROCESS_TERMINATED = "nw_integration::process_terminated";

export const SOCKET_CHANNELS = { NEWSLETTER_INTEGRATION_NAMESPACE } as const;

export const SOCKET_EVENTS = {
  NW_INTEGRATION_JOIN,
  NW_INTEGRATION_AUTH,
  NW_INTEGRATION_AUTH_OTP_REQ,
  NW_INTEGRATION_AUTH_OTP_RES,
  NW_INTEGRATION_AUDIENCE_LIST,
  NW_INTEGRATION_SELECT_AUDIENCE,
  NW_INTEGRATION_CONNECTION_ERR,
  NW_INTEGRATION_INSTANCE_STATUS,
  NW_INTEGRATION_AUTH_ERROR,
  NW_INTEGRATION_GENERIC_ERROR,
  NW_INTEGRATION_AUTH_SUCCESS,
  NW_INTEGRATION_FETCH_AUDIENCE_LIST,
  NW_INTEGRATION_AUTH_EMAIL_SENT,
  NW_INTEGRATION_AUTH_LINK_REQ,
  NW_INTEGRATION_AUDIENCE_CONNECTED,
  NW_INTEGRATION_TERMINATE_PROCESS,
  NW_INTEGRATION_PROCESS_TERMINATED,
} as const;
