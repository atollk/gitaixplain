<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainChat from "$lib/components/LangchainChat.svelte"
    import { GeminiInterface } from "$lib/backend/langchain_implementations"
    import { marked } from "marked"

    const foo = `
    Let's count the functions in each file.  Note that this is a count of defined functions, and doesn't include methods within classes.

* **\`src/gitingest/__init__.py\`**: 0 functions (only imports and \`__all__\`)
* **\`src/gitingest/cli.py\`**: 2 functions (\`main\`, \`_async_main\`)
* **\`src/gitingest/config.py\`**: 0 functions
* **\`src/gitingest/exceptions.py\`**: 0 functions (only class definitions)
* **\`src/gitingest/ignore_patterns.py\`**: 0 functions
* **\`src/gitingest/notebook_utils.py\`**: 3 functions (\`process_notebook\`, \`_process_cell\`, \`_extract_output\`)
* **\`src/gitingest/query_ingestion.py\`**: 11 functions (\`_normalize_path\`, \`_normalize_path_str\`, \`_get_encoding_list\`, \`_should_include\`, \`_should_exclude\`, \`_is_safe_symlink\`, \`_is_text_file\`, \`_read_file_content\`, \`_sort_children\`, \`_scan_directory\`, \`_process_item\`, \`_extract_files_content\`, \`_create_file_content_string\`, \`_create_summary_string\`, \`_create_tree_structure\`, \`_generate_token_string\`, \`_ingest_single_file\`, \`_ingest_directory\`, \`run_ingest_query\`)
* **\`src/gitingest/query_parser.py\`**: 8 functions (\`_normalize_pattern\`, \`_parse_patterns\`, \`_override_ignore_patterns\`, \`_parse_path\`, \`_is_valid_pattern\`, \`try_domains_for_user_and_repo\`, \`_get_user_and_repo_from_path\`, \`_validate_host\`, \`_validate_scheme\`, \`parse_query\`, \`_parse_repo_source\`, \`_configure_branch_and_subpath\`, \`_is_valid_git_commit_hash\`)
* **\`src/gitingest/repository_clone.py\`**: 4 functions (\`clone_repo\`, \`_check_repo_exists\`, \`fetch_remote_branch_list\`, \`_run_git_command\`, \`_get_status_code\`)
* **\`src/gitingest/repository_ingest.py\`**: 2 functions (\`ingest_async\`, \`ingest\`)
* **\`src/gitingest/utils.py\`**: 1 function (\`async_timeout\`)
* **\`src/server/routers/__init__.py\`**: 0 functions
* **\`src/server/routers/download.py\`**: 1 function (\`download_ingest\`)
* **\`src/server/routers/dynamic.py\`**: 2 functions (\`catch_all\`, \`process_catch_all\`)
* **\`src/server/routers/index.py\`**: 2 functions (\`home\`, \`index_post\`)
* **\`src/server/main.py\`**: 1 function (\`health_check\`, \`head_root\`, \`api_docs\`, \`robots\`)
* **\`src/server/query_processor.py\`**: 3 functions (\`process_query\`, \`_print_error\`, \`_print_success\`, \`_print_query\`)
* **\`src/server/server_config.py\`**: 0 functions
* **\`src/server/server_utils.py\`**: 3 functions (\`rate_limit_exception_handler\`, \`lifespan\`, \`_remove_old_repositories\`, \`_process_folder\`, \`log_slider_to_size\`)
* **\`tests/query_parser/test_git_host_agnostic.py\`**: 0 functions
* **\`tests/query_parser/test_query_parser.py\`**: 0 functions
* **\`tests/conftest.py\`**: 0 functions (only fixture definitions)
* **\`tests/test_cli.py\`**: 0 functions
* **\`tests/test_flow_integration.py\`**: 0 functions
* **\`tests/test_notebook_utils.py\`**: 0 functions
* **\`tests/test_query_ingestion.py\`**: 0 functions
* **\`tests/test_repository_clone.py\`**: 0 functions


Adding up the function counts from all files results in a total of **50** functions.`
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <LangchainChat
        model={new GeminiInterface({model: "gemini-1.5-flash", apiKey: "AIzaSyAny6NBpPmVlzCKCcOhVAHk6GY7XIq5dDw"})} />

    <div class="marked prose">
        {@html marked.parse(foo)}
    </div>
</main>

<style>
    .marked :global(ul) {
        list-style: disc;
    }
</style>