# API & Model Configuration

First, you want to need the model family or API provider to use with Gitaixplain.
There are two categories: AI as a service, such as Gemini or Groq; and a local AI, such as Ollama.
After picking one of these providers, you can configure it in more detail.

## AI as a service

Most LLMs in use nowadays are hosted by service providers such as Microsoft, Google, or OpenAI.
You use them by making network requests to their API.

### API Key

To authenticate yourself with the API provider and associate your usage with your account, you need to request an API
key at the provider and enter it in the field to use with Gitaixplain.
How to obtain an API key differs for each provider, so you have to look up their documentation.

#### Is it dangerous to enter my API key?

An API key is a valid resource and should never be given to third parties, so that's a valid question, but No, it is not
dangerous here.

Gitaixplain is a pure frontend application by design.
That means there is no backend the website could send your API key to with malicious intent.
You can verify this yourself with the source code or by checking your browser's network tab, which will show that the
only requests containing your API key are made directly to the AI provider.

In the future, we might provide the option to connect to a local proxy so you don't need to enter your API key here at
all.

### Model

Most AIaaS providers offer multiple models with different features and costs, so you can pick one to use.

## Ollama

If you have a decent hardware setup, you can run LLMs locally on it.
These will not have the same quality or speed as high-end models as a service, but they are essentially free to use
without any concerns of privacy.
You need to start a local Ollama process to serve the requests from Gitaixplain.

https://ollama.com/

### Setup: CORS

By default, an Ollama instance running on your own computer will block all requests from "outside" via Cross-Origin
Resource Sharing (CORS).
You need to add `https://atollk.github.io/` to the allowed origins for Ollama to work with Gitaixplain, otherwise you
will only receive network errors.
Consider the Ollama documentation for details on how to do that:

https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama

### Context Size

The context size describes how many tokens (i.e. groups of characters) can be sent to the AI model in a single input.
For most users, this value is not limited by the chosen model but rather by the hardware it is running on.

You can use the `ollama ps` command to check whether a chosen context size is too large.
The best size is the largest number which still uses 100% GPU and 0% CPU.
A rough estimate to start experimenting with is 500 tokens per GB of VRAM, so e.g. 12GB VRAM with a context size of
6000.