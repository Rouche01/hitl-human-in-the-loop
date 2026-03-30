import { STAGES } from "./constants";
import { INTEGRATION_FLOW, INTEGRATION_TYPE, FLOW_AUTH_TYPE } from "../../constants";

const { MAILCHIMP } = INTEGRATION_TYPE;
const mailchimpFlow = INTEGRATION_FLOW[MAILCHIMP];

const FLOW_CONFIG: Record<string, any> = {
  [mailchimpFlow.LOGIN]: {
    initialStage: {
      name: STAGES.LOGIN,
      urlState: "https://login.mailchimp.com",
    },
    authType: FLOW_AUTH_TYPE.AUTH,
  },
  [mailchimpFlow.TOTP]: {
    initialStage: {
      name: STAGES.TOTP,
      urlState:
        "https://us21.admin.mailchimp.com/login/tfa?referrer=%2F&stay-signed-in=N&from=",
    },
    authType: FLOW_AUTH_TYPE.AUTH,
  },
  [mailchimpFlow.SELECT_LIST]: {
    initialStage: {
      name: STAGES.SELECT_LIST,
      urlState: "https://us21.admin.mailchimp.com/lists/",
    },
    authType: FLOW_AUTH_TYPE.AUTHED,
  },
  [mailchimpFlow.EXTRACT_DATA]: {
    initialStage: {
      name: STAGES.EXTRACT_DATA,
      urlState: "https://us21.admin.mailchimp.com/lists/dashboard/overview",
    },
    authType: FLOW_AUTH_TYPE.AUTHED,
  },
};

export default FLOW_CONFIG;
