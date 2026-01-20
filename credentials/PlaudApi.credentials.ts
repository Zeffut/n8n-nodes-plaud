import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PlaudApi implements ICredentialType {
	name = 'plaudApi';
	displayName = 'Plaud API';
	documentationUrl = 'https://docs.plaud.ai/';
	properties: INodeProperties[] = [
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: [
				{
					name: 'Europe (EU)',
					value: 'https://api-euc1.plaud.ai',
				},
				{
					name: 'United States (US)',
					value: 'https://api.plaud.ai',
				},
				{
					name: 'Asia Pacific (APAC)',
					value: 'https://api-apac.plaud.ai',
				},
			],
			default: 'https://api-euc1.plaud.ai',
			description: 'Select the Plaud API region closest to you',
		},
		{
			displayName: 'Bearer Token',
			name: 'bearerToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Plaud bearer token. To get it: Go to plaud.ai and log in, open DevTools (F12) → Network tab, refresh the page, find any request to api.plaud.ai, and copy the Authorization header value (without "Bearer " prefix).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.bearerToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.region}}',
			url: '/device/list',
			method: 'GET',
		},
	};
}
