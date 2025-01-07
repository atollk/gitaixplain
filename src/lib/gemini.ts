import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ChatVertexAI } from "@langchain/google-vertexai"

export async function doCall(apiKey: string) {
	/*const model = new ChatVertexAI({
		model: "gemini-1.5-flash",
		temperature: 0,
		apiKey: apiKey,
	})

	const messages = [
		new SystemMessage("Translate the following from English into Italian"),
		new HumanMessage("hi!"),
	]
	 */

	return ""
	//await model.invoke(messages)
}
