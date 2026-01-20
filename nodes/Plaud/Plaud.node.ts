import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

export class Plaud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Plaud',
		name: 'plaud',
		icon: 'file:plaud.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Plaud AI API to manage recordings and devices',
		defaults: {
			name: 'Plaud',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'plaudApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Device',
						value: 'device',
					},
					{
						name: 'Recording',
						value: 'recording',
					},
				],
				default: 'recording',
			},
			// Device Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['device'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List all devices linked to your account',
						action: 'List all devices',
					},
				],
				default: 'list',
			},
			// Recording Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recording'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many recordings',
						action: 'Get many recordings',
					},
					{
						name: 'Get Download URL',
						value: 'getDownloadUrl',
						description: 'Get temporary download URL for a recording',
						action: 'Get download URL for a recording',
					},
					{
						name: 'Update Filename',
						value: 'updateFilename',
						description: 'Update the filename of a recording',
						action: 'Update filename of a recording',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download a recording as binary data',
						action: 'Download a recording',
					},
				],
				default: 'getMany',
			},
			// Recording: Get Many Options
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['getMany'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 20,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Include Trash',
						name: 'includeTrash',
						type: 'boolean',
						default: false,
						description: 'Whether to include recordings from trash',
					},
					{
						displayName: 'Sort By',
						name: 'sortBy',
						type: 'options',
						options: [
							{
								name: 'Created At',
								value: 'created_at',
							},
							{
								name: 'Updated At',
								value: 'updated_at',
							},
							{
								name: 'Filename',
								value: 'filename',
							},
						],
						default: 'created_at',
						description: 'Field to sort results by',
					},
					{
						displayName: 'Sort Descending',
						name: 'sortDescending',
						type: 'boolean',
						default: true,
						description: 'Whether to sort in descending order',
					},
				],
			},
			// Recording: Get Download URL
			{
				displayName: 'Recording ID',
				name: 'recordingId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['getDownloadUrl', 'updateFilename', 'download'],
					},
				},
				default: '',
				description: 'The ID of the recording',
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['getDownloadUrl', 'download'],
					},
				},
				options: [
					{
						name: 'Original',
						value: 'original',
						description: 'Original audio format',
					},
					{
						name: 'Opus',
						value: 'opus',
						description: 'Opus compressed format',
					},
				],
				default: 'original',
				description: 'The audio format to download',
			},
			// Recording: Update Filename
			{
				displayName: 'New Filename',
				name: 'newFilename',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['updateFilename'],
					},
				},
				default: '',
				description: 'The new filename for the recording',
			},
			// Recording: Download
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['recording'],
						operation: ['download'],
					},
				},
				default: 'data',
				description: 'Name of the binary property to store the downloaded file',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials to extract the base URL
		const credentials = await this.getCredentials('plaudApi');
		const baseUrl = credentials.region as string || 'https://api-euc1.plaud.ai';

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'device') {
					if (operation === 'list') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'plaudApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/device/list`,
								json: true,
							},
						);

						// Handle different response structures
						let devices: any[] = [];
						if (Array.isArray(response)) {
							devices = response;
						} else if (response.data && Array.isArray(response.data)) {
							devices = response.data;
						} else if (response.list && Array.isArray(response.list)) {
							devices = response.list;
						} else {
							// Return the raw response as a single item
							returnData.push({
								json: response,
								pairedItem: { item: i },
							});
							continue;
						}

						for (const device of devices) {
							returnData.push({
								json: device,
								pairedItem: { item: i },
							});
						}
					}
				}

				if (resource === 'recording') {
					if (operation === 'getMany') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 1000 : (this.getNodeParameter('limit', i) as number);
						const options = this.getNodeParameter('options', i) as {
							includeTrash?: boolean;
							sortBy?: string;
							sortDescending?: boolean;
						};

						let allRecordings: any[] = [];
						let skip = 0;
						const batchSize = 50;

						do {
							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'plaudApi',
								{
									method: 'GET' as IHttpRequestMethods,
									url: `${baseUrl}/file/simple/web`,
									qs: {
										skip,
										limit: Math.min(batchSize, limit - allRecordings.length),
										is_trash: options.includeTrash ? 1 : 0,
										sort_by: options.sortBy || 'created_at',
										is_desc: options.sortDescending !== false ? 1 : 0,
									},
									json: true,
								},
							);

							// Handle different response structures
							let recordings: any[] = [];
							if (Array.isArray(response)) {
								recordings = response;
							} else if (response && typeof response === 'object') {
								// Try to find an array in the response
								if (Array.isArray(response.list)) {
									recordings = response.list;
								} else if (Array.isArray(response.data)) {
									recordings = response.data;
								} else if (Array.isArray(response.files)) {
									recordings = response.files;
								} else if (Array.isArray(response.recordings)) {
									recordings = response.recordings;
								} else if (Array.isArray(response.items)) {
									recordings = response.items;
								} else {
									// Look for first array property in response
									for (const key of Object.keys(response)) {
										if (Array.isArray(response[key])) {
											recordings = response[key];
											break;
										}
									}
								}
							}

							allRecordings = allRecordings.concat(recordings);
							skip += batchSize;

							if (recordings.length < batchSize || allRecordings.length >= limit) {
								break;
							}
						} while (returnAll || allRecordings.length < limit);

						// Return each recording as a separate item
						const recordingsToReturn = allRecordings.slice(0, limit);
						for (let j = 0; j < recordingsToReturn.length; j++) {
							returnData.push({
								json: recordingsToReturn[j],
								pairedItem: { item: i },
							});
						}
					}

					if (operation === 'getDownloadUrl') {
						const recordingId = this.getNodeParameter('recordingId', i) as string;
						const format = this.getNodeParameter('format', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'plaudApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/file/temp-url/${recordingId}`,
								qs: {
									is_opus: format === 'opus' ? 1 : 0,
								},
								json: true,
							},
						);

						returnData.push({
							json: {
								recordingId,
								format,
								downloadUrl: format === 'opus' ? response.temp_url_opus : response.temp_url,
								tempUrl: response.temp_url,
								tempUrlOpus: response.temp_url_opus,
							},
							pairedItem: { item: i },
						});
					}

					if (operation === 'updateFilename') {
						const recordingId = this.getNodeParameter('recordingId', i) as string;
						const newFilename = this.getNodeParameter('newFilename', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'plaudApi',
							{
								method: 'PATCH' as IHttpRequestMethods,
								url: `${baseUrl}/file/${recordingId}`,
								body: {
									filename: newFilename,
								},
								json: true,
							},
						);

						returnData.push({
							json: {
								recordingId,
								newFilename,
								success: response.status === 'success' || response.status === 200,
								message: response.message,
								data: response.data,
							},
							pairedItem: { item: i },
						});
					}

					if (operation === 'download') {
						const recordingId = this.getNodeParameter('recordingId', i) as string;
						const format = this.getNodeParameter('format', i) as string;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

						// First get the temporary download URL
						const urlResponse = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'plaudApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/file/temp-url/${recordingId}`,
								qs: {
									is_opus: format === 'opus' ? 1 : 0,
								},
								json: true,
							},
						);

						const downloadUrl = format === 'opus' ? urlResponse.temp_url_opus : urlResponse.temp_url;

						if (!downloadUrl) {
							throw new Error(`No download URL available for format: ${format}`);
						}

						// Download the file
						const binaryData = await this.helpers.httpRequest({
							method: 'GET' as IHttpRequestMethods,
							url: downloadUrl,
							encoding: 'arraybuffer',
						});

						const fileName = `recording_${recordingId}.${format === 'opus' ? 'opus' : 'wav'}`;
						const mimeType = format === 'opus' ? 'audio/opus' : 'audio/wav';

						const binary = await this.helpers.prepareBinaryData(
							Buffer.from(binaryData),
							fileName,
							mimeType,
						);

						returnData.push({
							json: {
								recordingId,
								format,
								fileName,
							},
							binary: {
								[binaryPropertyName]: binary,
							},
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
