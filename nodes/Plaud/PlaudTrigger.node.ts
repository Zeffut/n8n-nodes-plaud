import type {
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	INodeExecutionData,
	IHttpRequestMethods,
} from 'n8n-workflow';

export class PlaudTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Plaud Trigger',
		name: 'plaudTrigger',
		icon: 'file:plaud.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a new recording is available on your Plaud account',
		defaults: {
			name: 'Plaud Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'plaudApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Max New Recordings Per Poll',
				name: 'maxRecordings',
				type: 'number',
				default: 10,
				description: 'Maximum number of new recordings to return per poll',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const maxRecordings = this.getNodeParameter('maxRecordings', 10) as number;
		const mode = this.getMode();

		// Get credentials to extract the base URL
		const credentials = await this.getCredentials('plaudApi');
		const baseUrl = credentials.region as string || 'https://api-euc1.plaud.ai';

		// Get the static data to store the last seen recording IDs
		const staticData = this.getWorkflowStaticData('node');

		try {
			// Fetch recent recordings
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'plaudApi',
				{
					method: 'GET' as IHttpRequestMethods,
					url: `${baseUrl}/file/simple/web`,
					qs: {
						skip: 0,
						limit: maxRecordings * 2,
						is_trash: 0,
						sort_by: 'created_at',
						is_desc: 1,
					},
					json: true,
				},
			);

			// Handle different response structures
			let recordings: any[] = [];
			if (Array.isArray(response)) {
				recordings = response;
			} else if (response && typeof response === 'object') {
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
					for (const key of Object.keys(response)) {
						if (Array.isArray(response[key])) {
							recordings = response[key];
							break;
						}
					}
				}
			}

			if (recordings.length === 0) {
				return null;
			}

			// If manual/test mode, return the latest recording as if it were new
			if (mode === 'manual') {
				const latestRecording = recordings[0];
				return [[{ json: latestRecording }]];
			}

			// Initialize seen IDs if not exists
			if (!staticData.seenIds) {
				staticData.seenIds = [] as string[];
			}

			const seenIds = staticData.seenIds as string[];
			const isFirstRun = seenIds.length === 0;

			if (isFirstRun) {
				// On first run, store all current IDs and don't trigger
				staticData.seenIds = recordings.map((r: any) => r.id);
				staticData.lastPollTime = Date.now();
				return null;
			}

			// Find new recordings (not in seenIds)
			const newRecordings = recordings.filter((recording: any) => {
				return !seenIds.includes(recording.id);
			});

			if (newRecordings.length === 0) {
				return null;
			}

			// Update seen IDs
			const allCurrentIds = recordings.map((r: any) => r.id);
			const combinedIds = [...new Set([...allCurrentIds, ...seenIds])];
			staticData.seenIds = combinedIds.slice(0, 500);
			staticData.lastPollTime = Date.now();

			// Build return data - each recording as separate item
			const recordingsToReturn = newRecordings.slice(0, maxRecordings);
			const returnData: INodeExecutionData[] = [];

			for (const recording of recordingsToReturn) {
				returnData.push({
					json: recording,
				});
			}

			return [returnData];

		} catch (error) {
			throw new Error(`Failed to poll Plaud API: ${(error as Error).message}`);
		}
	}
}
