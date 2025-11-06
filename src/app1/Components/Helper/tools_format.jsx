// tools_format.js
export const mcpTools = [
  // Notion Functions
{
  type: "function",
  name: "get_notion_databases",
  description: "List all accessible Notion databases in the workspace",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
},
{
  type: "function",
  name: "get_notion_data",
  description: "Fetch data from a Notion database. Accepts either database name or ID.",
  parameters: {
    type: "object",
    properties: {
      database_identifier: {
        type: "string",
        description: "Name or ID of the database to fetch data from (e.g., 'Task Tracker' or 'abc123'). If not provided, uses NOTION_DATABASE_ID from environment"
      },
      page_size: {
        type: "integer",
        description: "Maximum number of pages to return",
        default: 100
      }
    },
    required: []
  }
},
{
  type: "function",
  name: "get_notion_page_data",
  description: "Fetch complete page data including content and embedded databases",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Page name or ID"
      },
      fetch_content: {
        type: "boolean",
        description: "Whether to retrieve page content",
        default: true
      },
      fetch_children: {
        type: "boolean",
        description: "Whether to retrieve child databases/pages",
        default: true
      }
    },
    required: ["page_identifier"]
  }
},
{
  type: "function",
  name: "search_notion_pages",
  description: "Search for pages across all accessible Notion content",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text to find pages and databases"
      },
      page_size: {
        type: "integer",
        description: "Maximum number of results to return",
        default: 50
      }
    },
    required: ["query"]
  }
},
{
  type: "function",
  name: "update_notion_page",
  description: "Update properties of an existing Notion page. Accepts either page name or ID.",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Name or ID of the page to update (e.g., 'Meeting Notes' or 'def456')"
      },
      title: {
        type: "string",
        description: "New title for the page (optional)"
      },
      properties: {
        type: "object",
        description: "Dictionary of properties to update (optional)"
      },
      archived: {
        type: "boolean",
        description: "Whether to archive or unarchive the page (optional)"
      }
    },
    required: ["page_identifier"]
  }
},
{
  type: "function",
  name: "append_notion_page_content",
  description: "Add content blocks to the end of an existing Notion page. Accepts either page name or ID.",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Name or ID of the page to add content to (e.g., 'Project Plan' or 'ghi789')"
      },
      blocks: {
        type: "array",
        description: "List of content blocks to append to the page",
        items: {
          type: "object",
          description: "Notion content block object (paragraph, heading, list, etc.)"
        }
      }
    },
    required: ["page_identifier", "blocks"]
  }
},
{
  type: "function",
  name: "create_notion_database",
  description: "Create a new database inside a specified Notion page. Accepts either parent page name or ID.",
  parameters: {
    type: "object",
    properties: {
      parent_page_identifier: {
        type: "string",
        description: "Name or ID of the parent page where database should be created (e.g., 'Engineering Docs' or 'abc123')"
      },
      title: {
        type: "string",
        description: "Title for the new database"
      },
      properties: {
        type: "object",
        description: "Dictionary of property definitions (defaults to just a 'Name' title property if not provided)"
      },
      description: {
        type: "string",
        description: "Optional description for the database"
      }
    },
    required: ["parent_page_identifier", "title"]
  }
},
{
  type: "function",
  name: "create_notion_page_in_database",
  description: "Create a new page in an existing Notion database with optional properties and content. Accepts either database name or ID.",
  parameters: {
    type: "object",
    properties: {
      database_identifier: {
        type: "string",
        description: "Name or ID of the target database (e.g., 'Tasks Tracker' or 'def456')"
      },
      title: {
        type: "string",
        description: "Title for the new page"
      },
      properties: {
        type: "object",
        description: "Dictionary of properties to set on the new page"
      },
      content_blocks: {
        type: "array",
        description: "List of content blocks to add to the page",
        items: {
          type: "object",
          description: "Notion content block object (paragraph, heading, list, etc.)"
        }
      }
    },
    required: ["database_identifier", "title"]
  }
},
{
  type: "function",
  name: "add_notion_database_property",
  description: "Add a new property to a Notion database with validated payload structure",
  parameters: {
    type: "object",
    properties: {
      database_identifier: {
        type: "string",
        description: "Database name or ID"
      },
      property_name: {
        type: "string",
        description: "Name for the new property"
      },
      property_type: {
        type: "string",
        enum: ["email", "text", "select", "number"],
        description: "Type of property to add"
      },
      property_options: {
        type: "object",
        description: "Required for select/multi-select",
        properties: {
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" }
              }
            }
          }
        }
      }
    },
    required: ["database_identifier", "property_name", "property_type"]
  }
},
{
  type: "function",
  name: "get_notion_comments",
  description: "Retrieve all comments from a Notion page. Accepts either page name or ID.",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Name or ID of the page to get comments from (e.g., 'Sprint Planning' or 'jkl012')"
      }
    },
    required: ["page_identifier"]
  }
},
{
  type: "function",
  name: "create_notion_comment",
  description: "Add a comment to a Notion page. Accepts either page name or ID.",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Name or ID of the page to comment on (e.g., 'Design Review' or 'mno345')"
      },
      comment_text: {
        type: "string",
        description: "The text content of the comment"
      }
    },
    required: ["page_identifier", "comment_text"]
  }
},
{
  type: "function",
  name: "archive_notion_page",
  description: "Archive or restore a Notion page (soft delete). Accepts either page name or ID.",
  parameters: {
    type: "object",
    properties: {
      page_identifier: {
        type: "string",
        description: "Name or ID of the page to archive or restore (e.g., 'Old Meeting Notes' or 'yz123')"
      },
      archived: {
        type: "boolean",
        description: "True to archive the page, False to restore it",
        default: true
      }
    },
    required: ["page_identifier"]
  }
},
{
  type: "function",
  name: "get_notion_users",
  description: "Get information about all users in the Notion workspace",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
},

// Slack Functions
{
  type: "function",
  name: "get_slack_channels",
  description: "Get all Slack channels in the workspace",
  parameters: {
    type: "object",
    properties: {}
  }
},
{
  type: "function",
  name: "get_slack_channel_by_name",
  description: "Get a specific Slack channel by name",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Channel name (with or without #)"
      }
    },
    required: ["name"]
  }
},
{
  type: "function",
  name: "send_slack_message",
  description: "Send a message to a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel to send message to"
      },
      text: {
        type: "string",
        description: "Message text to send"
      }
    },
    required: ["channel_name", "text"]
  }
},
{
  type: "function",
  name: "get_slack_messages",
  description: "Get recent messages from a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel to get messages from"
      },
      limit: {
        type: "integer",
        description: "Number of messages to retrieve (default: 150)"
      }
    },
    required: ["channel_name"]
  }
},
{
  type: "function",
  name: "find_slack_messages",
  description: "Find messages containing specific text in a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel to search in"
      },
      search_text: {
        type: "string",
        description: "Text to search for in messages"
      },
      limit: {
        type: "integer",
        description: "Number of recent messages to search through (default: 200)"
      }
    },
    required: ["channel_name", "search_text"]
  }
},
{
  type: "function",
  name: "find_slack_messages_by_user",
  description: "Find all messages from a specific user in a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel to search in"
      },
      username: {
        type: "string",
        description: "Username, real name, or display name of the user to find messages from"
      },
      limit: {
        type: "integer",
        description: "Number of recent messages to search through (default: 200)"
      }
    },
    required: ["channel_name", "username"]
  }
},
{
  type: "function",
  name: "find_recent_slack_messages_with_keywords",
  description: "Find recent messages containing any of the specified keywords in a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel to search in"
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "List of keywords to search for in messages"
      },
      limit: {
        type: "integer",
        description: "Number of recent messages to search through (default: 200)"
      }
    },
    required: ["channel_name", "keywords"]
  }
},
{
  type: "function",
  name: "list_slack_users",
  description: "List all users in the Slack workspace",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "integer",
        description: "Maximum number of users to return (default: 100)"
      },
      include_bots: {
        type: "boolean",
        description: "Whether to include bot users in the results (default: false)"
      }
    },
    required: []
  }
},
{
  type: "function",
  name: "get_slack_thread_replies",
  description: "Get replies to a message thread using timestamp or message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      thread_ts: {
        type: "string",
        description: "Thread timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Text content of the parent message (optional if thread_ts provided)"
      },
      limit: {
        type: "integer",
        description: "Number of replies to retrieve (default: 50)"
      }
    },
    required: ["channel_name"]
  }
},
{
  type: "function",
  name: "send_slack_thread_reply",
  description: "Send a reply to a message thread using timestamp or message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      text: {
        type: "string",
        description: "Reply message text"
      },
      thread_ts: {
        type: "string",
        description: "Thread timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Text content of the parent message (optional if thread_ts provided)"
      }
    },
    required: ["channel_name", "text"]
  }
},
{
  type: "function",
  name: "get_slack_user_info",
  description: "Get information about a Slack user",
  parameters: {
    type: "object",
    properties: {
      user_id: {
        type: "string",
        description: "Slack user ID (optional if username provided)"
      },
      username: {
        type: "string",
        description: "Username or email (optional if user_id provided)"
      }
    },
    required: []
  }
},
{
  type: "function",
  name: "get_slack_channel_members",
  description: "Get members of a Slack channel",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      limit: {
        type: "integer",
        description: "Number of members to retrieve (default: 100)"
      }
    },
    required: ["channel_name"]
  }
},
{
  type: "function",
  name: "add_slack_reaction",
  description: "Add a reaction to a message using timestamp or message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      emoji: {
        type: "string",
        description: "Emoji name (without colons, e.g., 'thumbsup', 'rocket')"
      },
      timestamp: {
        type: "string",
        description: "Message timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Text content of the message to react to (optional if timestamp provided)"
      }
    },
    required: ["channel_name", "emoji"]
  }
},
{
  type: "function",
  name: "get_slack_message_reactions",
  description: "Get reactions on a message using timestamp or message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      timestamp: {
        type: "string",
        description: "Message timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Text content of the message (optional if timestamp provided)"
      }
    },
    required: ["channel_name"]
  }
},
{
  type: "function",
  name: "update_slack_message",
  description: "Update/edit a message using timestamp or original message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      new_text: {
        type: "string",
        description: "New message text"
      },
      timestamp: {
        type: "string",
        description: "Message timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Original message text to find and update (optional if timestamp provided)"
      }
    },
    required: ["channel_name", "new_text"]
  }
},
{
  type: "function",
  name: "delete_slack_message",
  description: "Delete a message using timestamp or message text",
  parameters: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "Name of the channel"
      },
      timestamp: {
        type: "string",
        description: "Message timestamp (optional if message_text provided)"
      },
      message_text: {
        type: "string",
        description: "Text content of the message to delete (optional if timestamp provided)"
      }
    },
    required: ["channel_name"]
  }
},

// Jira Functions
{
  type: "function",
  name: "get_jira_projects",
  description: "Get all Jira projects that the user has access to",
  parameters: {
    type: "object",
    properties: {}
  }
},
{
  type: "function",
  name: "get_jira_issues",
  description: "Get Jira issues from a project by name/key or by JQL query",
  parameters: {
    type: "object",
    properties: {
      project_identifier: {
        type: "string",
        description: "Project name (e.g., 'My Project') or project key (e.g., 'MP', 'DEV') to get issues from"
      },
      jql: {
        type: "string",
        description: "JQL (Jira Query Language) query to filter issues"
      },
      max_results: {
        type: "integer",
        description: "Maximum number of issues to return (default: 50)",
        default: 50
      }
    }
  }
},
{
  type: "function",
  name: "create_jira_issue",
  description: "Create a new Jira issue",
  parameters: {
    type: "object",
    properties: {
      project_identifier: {
        type: "string",
        description: "Project name (e.g., 'My Project') or project key (e.g., 'MP', 'DEV') where to create the issue"
      },
      summary: {
        type: "string",
        description: "Issue title/summary"
      },
      description: {
        type: "string",
        description: "Detailed description of the issue"
      },
      issue_type: {
        type: "string",
        description: "Type of issue (Task, Bug, Story, Epic, etc.)",
        default: "Task"
      }
    },
    required: ["project_identifier", "summary", "description"]
  }
},
{
  type: "function",
  name: "update_jira_issue_comprehensive",
  description: "Update all properties of a Jira issue including custom fields, relationships, and time tracking",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to update (e.g., 'PROJ-123', 'SCRUM-5')"
      },
      summary: {
        type: "string",
        description: "Issue title/summary"
      },
      description: {
        type: "string",
        description: "Issue description"
      },
      issue_type: {
        type: "string",
        description: "Issue type (Task, Story, Bug, Epic, Subtask, etc.)"
      },
      assignee: {
        type: "string",
        description: "Username or email of assignee (use 'unassigned' to remove assignee)"
      },
      reporter: {
        type: "string",
        description: "Username or email of reporter"
      },
      priority: {
        type: "string",
        description: "Priority level (Highest, High, Medium, Low, Lowest)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "List of labels to set on the issue"
      },
      components: {
        type: "array",
        items: { type: "string" },
        description: "List of component names"
      },
      fix_versions: {
        type: "array",
        items: { type: "string" },
        description: "List of version names where issue is fixed"
      },
      affects_versions: {
        type: "array",
        items: { type: "string" },
        description: "List of version names affected by the issue"
      },
      environment: {
        type: "string",
        description: "Environment description"
      },
      due_date: {
        type: "string",
        description: "Due date in YYYY-MM-DD format"
      },
      original_estimate: {
        type: "string",
        description: "Original time estimate (e.g., '1w 2d 3h 4m')"
      },
      remaining_estimate: {
        type: "string",
        description: "Remaining time estimate (e.g., '2d 4h')"
      },
      story_points: {
        type: "number",
        description: "Story points for the issue"
      },
      epic_link: {
        type: "string",
        description: "Epic issue key if this issue is linked to an epic"
      },
      parent: {
        type: "string",
        description: "Parent issue key if this is a subtask"
      },
      custom_fields: {
        type: "object",
        description: "Dict of custom field IDs/names and their values"
      },
      status: {
        type: "string",
        description: "Status to transition to (In Progress, Done, Closed, etc.)"
      },
      resolution: {
        type: "string",
        description: "Resolution (Fixed, Won't Fix, Duplicate, etc.)"
      }
    },
    required: ["issue_key"]
  }
},
{
  type: "function",
  name: "get_jira_issue",
  description: "Get detailed information about a specific Jira issue",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "Issue key (e.g., 'MP-123')"
      }
    },
    required: ["issue_key"]
  }
},
{
  type: "function",
  name: "delete_jira_issue",
  description: "Delete a Jira issue by its key",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to delete (e.g., 'PROJ-123', 'DEV-456')"
      }
    },
    required: ["issue_key"]
  }
},
{
  type: "function",
  name: "assign_jira_issue",
  description: "Assign a Jira issue to a user (automatically searches for user and uses account ID)",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to assign (e.g., 'PROJ-123', 'SCRUM-4')"
      },
      assignee: {
        type: "string",
        description: "User's display name, email, or username (e.g., 'Anees Qureshi', 'anees@company.com')"
      }
    },
    required: ["issue_key", "assignee"]
  }
},
{
  type: "function",
  name: "get_jira_project_users",
  description: "Get all users who have access to a specific Jira project and can be assigned issues",
  parameters: {
    type: "object",
    properties: {
      project_identifier: {
        type: "string",
        description: "Project name (e.g., 'My Project') or project key (e.g., 'SCRUM', 'DEV')"
      },
      max_results: {
        type: "integer",
        description: "Maximum number of users to return (default: 50)",
        default: 50
      }
    },
    required: ["project_identifier"]
  }
},
{
  type: "function",
  name: "add_jira_comment",
  description: "Add a comment to a Jira issue",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to comment on (e.g., 'PROJ-123', 'DEV-456')"
      },
      comment: {
        type: "string",
        description: "The comment text to add to the issue"
      }
    },
    required: ["issue_key", "comment"]
  }
},
{
  type: "function",
  name: "get_jira_comments",
  description: "Get all comments for a specific Jira issue",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to get comments from (e.g., 'PROJ-123', 'DEV-456')"
      }
    },
    required: ["issue_key"]
  }
},
{
  type: "function",
  name: "transition_jira_issue",
  description: "Change the status of a Jira issue by transitioning it through the workflow",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to transition (e.g., 'PROJ-123', 'DEV-456')"
      },
      status: {
        type: "string",
        description: "The target status to transition to (e.g., 'In Progress', 'Done', 'Closed')"
      }
    },
    required: ["issue_key", "status"]
  }
},
{
  type: "function",
  name: "get_jira_transitions",
  description: "Get all available status transitions for a specific Jira issue",
  parameters: {
    type: "object",
    properties: {
      issue_key: {
        type: "string",
        description: "The Jira issue key to get transitions for (e.g., 'PROJ-123', 'DEV-456')"
      }
    },
    required: ["issue_key"]
  }
},
{
  type: "function",
  name: "search_jira_users",
  description: "Search for Jira users by name or email",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query to find users (name, email, or partial match)"
      },
      max_results: {
        type: "integer",
        description: "Maximum number of users to return (default: 20)",
        default: 20
      }
    },
    required: ["query"]
  }
},
{
  type: "function",
  name: "get_jira_issue_types",
  description: "Get all available issue types for a specific project",
  parameters: {
    type: "object",
    properties: {
      project_identifier: {
        type: "string",
        description: "Project name (e.g., 'My Project') or project key (e.g., 'MP', 'DEV')"
      }
    },
    required: ["project_identifier"]
  }
},
{
  type: "function",
  name: "get_jira_project_statuses",
  description: "Get all available statuses for a specific project",
  parameters: {
    type: "object",
    properties: {
      project_identifier: {
        type: "string",
        description: "Project name (e.g., 'My Project') or project key (e.g., 'MP', 'DEV')"
      }
    },
    required: ["project_identifier"]
  }
}
];


// Session configuration with instructions
export const sessionInstructions = `Important: Always respond **only in English**, regardless of the language or tone of the user's input. 
IMPORTANT: You have access to a special tool called 'get_meeting_context' that lets you retrieve:
- Full meeting transcripts
- Meeting summaries
- Search for specific topics discussed
- List of participants

When users ask questions like:
- "What did we discuss about X?" → Call get_meeting_context with query_type='specific_topic'
- "Who's in this meeting?" → Call get_meeting_context with query_type='participants'
- "Summarize what we talked about" → Call get_meeting_context with query_type='summary'
- "What was said earlier?" → Call get_meeting_context with query_type='full_transcript'

ALWAYS use the get_meeting_context tool when users ask about the meeting conversation.
DO NOT try to remember the conversation from your session instructions - use the tool instead.
You are assisting users in a live WebRTC video meeting. Respond clearly and concisely to any questions asked during the session. 
Be expressive, emotionally aware, and human-like in your tone. Keep your responses natural and conversational, as if you're talking directly to someone you care about. 

You have access to external tools for Notion, Slack, Jira, and GitHub through MCP server. When users ask about these services, use the appropriate tools to fetch real-time data. 
Always wait for tool results before responding - the data will come to you as text after the tool call completes.

You also have access to a special tool called 'web_search'.
When users ask about current events, facts, or online information,
use the 'web_search' tool with the query they asked.

Examples:
- "What’s new in AI?" → call web_search({ query: "latest AI news" })
- "Who won the football match today?" → call web_search({ query: "today football match result" })
You can call the tool 'get_weather' to fetch the current weather in any location.

Always summarize the search results clearly before responding.
`;

