import { STAGES } from "./constants";
import { INTEGRATION_FLOW, INTEGRATION_TYPE, FLOW_AUTH_TYPE } from "../../constants";

const { SUBSTACK } = INTEGRATION_TYPE;
const substackFlow = INTEGRATION_FLOW[SUBSTACK];

const FLOW_CONFIG: Record<string, any> = {
  [substackFlow.LOGIN]: {
    initialStage: {
      name: STAGES.LOGIN,
      urlState: "https://substack.com/sign-in",
    },
    authType: FLOW_AUTH_TYPE.AUTH,
  },
  [substackFlow.AUTH_LINK]: {
    initialStage: {
      name: STAGES.AUTH_LINK,
      urlState: "https://substack.com/home",
    },
    authType: FLOW_AUTH_TYPE.AUTH,
  },
  [substackFlow.SELECT_LIST]: {
    initialStage: {
      name: STAGES.SELECT_LIST,
      urlState: "https://substack.com/settings",
    },
    authType: FLOW_AUTH_TYPE.AUTHED,
  },
  [substackFlow.EXTRACT_DATA]: {
    initialStage: {
      name: STAGES.EXTRACT_DATA,
      urlState: "",
    },
    authType: FLOW_AUTH_TYPE.AUTHED,
  },
};

export default FLOW_CONFIG;
