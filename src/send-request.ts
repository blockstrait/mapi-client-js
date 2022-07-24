import axios, { AxiosResponse } from 'axios';

import { MalformedResponseError } from './errors';
import { JSONEnvelope, JSONEnvelopeObject } from './json-envelope';

function parsePayload(response: JSONEnvelopeObject) {
  const jsonEnvelope = new JSONEnvelope(response);

  let payload;

  try {
    payload = JSON.parse(jsonEnvelope.payload);
  } catch (error) {
    throw new MalformedResponseError('Invalid JSON payload received');
  }

  return payload;
}

/**
 * @internal
 */
export class ServerErrorResponse extends Error {
  readonly statusCode: number;
  readonly response: string;

  constructor(statusCode: number, response: string) {
    super(`Server error response received with status code: ${statusCode}`);

    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * @internal
 */
export class RequestError extends Error {
  readonly request: any;

  constructor(request: any) {
    super('Error received after sending a request');

    this.request = request;
  }
}

/**
 * @internal
 */
export async function sendGetRequest(url: string, bearerToken?: string) {
  const headers: any = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  if (bearerToken) {
    headers.token = bearerToken;
  }

  let response: any;

  try {
    /* eslint @typescript-eslint/indent: "off" */
    response = await axios.get<
      JSONEnvelopeObject,
      AxiosResponse<JSONEnvelopeObject>
    >(url, {
      headers,
      responseType: 'json',
    });
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new ServerErrorResponse(error.response.status, error.response.data);
    } else if (error.request) {
      throw new RequestError(error.request);
    } else {
      throw new Error('Unexpected error ocurred');
    }
  }

  return parsePayload(response.data);
}

/**
 * @internal
 */
export async function sendPostRequest(
  url: string,
  data: any,
  bearerToken?: string
) {
  const headers: any = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  let response: any;

  try {
    /* eslint @typescript-eslint/indent: "off" */
    response = await axios.post<
      JSONEnvelopeObject,
      AxiosResponse<JSONEnvelopeObject>
    >(url, data, {
      headers,
      responseType: 'json',
    });
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new ServerErrorResponse(error.response.status, error.response.data);
    } else if (error.request) {
      throw new RequestError(error.request);
    } else {
      throw new Error('Unexpected error ocurred');
    }
  }

  return parsePayload(response.data);
}
