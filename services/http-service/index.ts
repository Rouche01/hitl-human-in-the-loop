import axios from "axios";
import { appConfig } from "../../config";
import { PublisherChannelMetricUpdateReqBody } from "./type-defs";

const { creatuulsPlatform } = appConfig;

const creatuulsApiClient = axios.create({
  baseURL: creatuulsPlatform.apiEndpoint,
  headers: { [creatuulsPlatform.apiKeyHeader || "x-api-key"]: creatuulsPlatform.adminApiKey },
});

/**
 * Updates publisher channel metric with retrieved audience data
 *
 * @param {string} channelId
 * @param {string} channelType
 * @param {PublisherChannelMetricUpdateReqBody} publisherChannelMetricUpdateReqBody
 */
const callPublisherChannelMetricUpdate = async (
  channelId: string,
  channelType: string,
  { clickthroughRate, openRate, subscriberSize }: PublisherChannelMetricUpdateReqBody
): Promise<void> => {
  const response = await creatuulsApiClient.patch(
    `/channels/${channelId}/metrics?channelType=${channelType}`,
    { clickthroughRate, openRate, subscriberSize }
  );

  console.log(`Channel id (${channelId}) => ${response.data.message}`);
};

export { creatuulsApiClient, callPublisherChannelMetricUpdate };
