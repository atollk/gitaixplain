import {
	HumanMessage,
	type MessageContent,
	type MessageContentText,
	SystemMessage,
} from "@langchain/core/messages"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

export async function fetchRepoSummary(url: string): Promise<string> {
	const apiUrl = "https://api.repomix.com/api/pack"
	const requestBody = JSON.stringify({
		format: "xml",
		options: {
			directoryStructure: true,
			fileSummary: true,
			removeComments: false,
			removeEmptyLines: false,
			showLineNumbers: false,
		},
		signal: {},
		url: url,
	})
	const response = await fetch(apiUrl, {
		method: "POST",
		body: requestBody,
	})
	const responseBody = await response.json()
	if (!response.ok) {
		throw new Error(`Response status: ${response.status} ${JSON.stringify(responseBody)}`)
	}
	return responseBody.content
}

export async function doCall(apiKey: string, repoSummary: string): Promise<string> {
	const model = new ChatGoogleGenerativeAI({
		model: "gemini-1.5-flash",
		temperature: 0,
		apiKey: apiKey,
	})

	console.log("RepoSummary:", repoSummary)
	const messages = [
		new SystemMessage(
			"Consider the following summary of a Git repository. " +
				"Generate a human-readable summary for it, especially the functioning of the code and general implementation. " +
				"End the message with a marker '!GRAPHSTART' and a Graphviz code block that renders a visual flow graph of relevant information to understand the repository.",
		),
		new HumanMessage(repoSummary),
	]

	const response = await model.invoke(messages)
	return response.content as string
}
