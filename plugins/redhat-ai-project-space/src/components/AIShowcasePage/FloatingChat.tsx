import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Close as CloseOutlined, ChatBubble } from '@material-ui/icons';
import { v4 as uuidv4 } from 'uuid';
import {
  useApi,
  configApiRef,
  identityApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { MarkdownContent } from '@backstage/core-components';
import { buildAIProjectContext } from './utils';

const FloatingChat = () => {
  const greetingMessage = [
    {
      sender: 'bot',
      text: `Hello! 👋 I'm the Convo AI Projects Assistant! I can answer questions about AI projects and capabilities. How can I help?`,

    },
  ];
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(uuidv4());
  const [conversation, setConversation] = useState(greetingMessage);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('You');
  const [aiProjectContext, setAiProjectContext] = useState<string[]>([]);
  const [contextLoadError, setContextLoadError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const config = useApi(configApiRef);
  const identity = useApi(identityApiRef);
  const fetchApi = useApi(fetchApiRef);
  const catalogApi = useApi(catalogApiRef);
  const backendUrl = config.getString('backend.baseUrl');
  const theme = useTheme();

  const systemPrompt = `
    You are a helpful assistant that can answer questions about the AI projects in the Red Hat AI Projects space.
    You are given a context of the AI projects in the Red Hat AI Projects space.
    You are also given a question from the user.
    You should answer the question based on the context.
    If you don't know the answer, you should say so.
    If you know the answer, you should answer the question.
    You should answer the question in a friendly and helpful manner.
    You should answer the question in a way that is easy to understand.
    You should answer the question in a way that is helpful to the user.
    Do not list the projects, just answer the question. Do not mention the context, just answer the question.
    Do not output a display or ranking of the projects, just answer the question.
    If multiple projects are relevant, you should answer the question for each project.
    If no projects are relevant, you should say so.
    If the question is not related to the AI projects in the Red Hat AI Projects space, you should say so.
    If the question is not clear, you should ask for more information.
    If the question is not related to the AI projects in the Red Hat AI Projects space, you should say so.
    Don't used tables in your answer, respond with prose or bullet lists.
    Never mention the context in your answer, just answer the question.
    If you are asked how to install, configure, use, or anything else related to the projects, provide a link to the github repository for the project.
    `

  const userPrompt = `
  INST]\nQuestion: {question}\n\nContext: {context}\n\nPlease provide a brief answer based on the context above.\n[/INST]
  `

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const identityResponse = await identity.getProfileInfo();
        setUsername(identityResponse.displayName || 'You');
      } catch (error) {
        console.error('Failed to fetch username:', error);
        // Continue with default username
      }
    };

    const fetchAIProjectContext = async () => {
      try {
        const proseDescriptions = await buildAIProjectContext(catalogApi);
        setAiProjectContext(proseDescriptions);
        setContextLoadError(false);
        console.log('AI Project Context:');
        console.log('Number of projects:', proseDescriptions.length);
        console.log('Prose descriptions:', proseDescriptions);
      } catch (error) {
        console.error('Failed to fetch AI project context:', error);
        setContextLoadError(true);
        setAiProjectContext([]);
      }
    };

    fetchUsername();
    fetchAIProjectContext();
  }, [catalogApi, identity]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const interactionId = uuidv4();
    const newConversation = [...conversation, { sender: 'human', text: input }];
    setConversation(newConversation);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      // Check if context is available
      if (contextLoadError || aiProjectContext.length === 0) {
        setConversation(prev => [
          ...prev,
          {
            sender: 'bot',
            text: 'I apologize, but I was unable to load the AI projects context. Please try refreshing the page. If the problem persists, contact support.',
            interactionId,
          },
        ]);
        setLoading(false);
        return;
      }

      const response = await fetchApi.fetch(
        `${backendUrl}/api/proxy/tangerine/api/assistants/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistants: ["clowder"],
            sessionId,
            client: 'ai-projects-chat',
            query: userInput,
            sender: 'human',
            stream: true,
            interactionId,
            chunks: aiProjectContext,
            no_persist_chunks: true,
            prompt: systemPrompt,
            userPrompt: userPrompt,
          }),
        },
      );

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botContent = '';
      setConversation(prev => [
        ...prev,
        { sender: 'bot', text: '', interactionId },
      ]);

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const json = JSON.parse(line.replace(/^data:\s*/, ''));
                if (json.text_content) {
                  botContent += json.text_content;

                  setConversation(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = botContent;
                    return updated;
                  });
                }
              } catch (e) {
                console.error('Error parsing streamed JSON:', e, line);
                // Continue processing other lines even if one fails
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Error reading stream:', streamError);
        throw new Error('Connection interrupted while receiving response');
      }

      // If no content was received, show an error
      if (!botContent.trim()) {
        throw new Error('No response received from the assistant');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Determine user-friendly error message
      let errorMessage = 'I apologize, but I encountered an error processing your request. ';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Please check your network connection and try again.';
      } else if (error instanceof Error) {
        if (error.message.includes('HTTP error')) {
          errorMessage += 'The service is currently unavailable. Please try again later.';
        } else if (error.message.includes('interrupted')) {
          errorMessage += 'The connection was interrupted. Please try again.';
        } else if (error.message.includes('No response')) {
          errorMessage += 'I did not receive a response. Please try rephrasing your question.';
        } else {
          errorMessage += 'Please try again or contact support if the issue persists.';
        }
      }

      setConversation(prev => {
        // Check if there's an empty bot message waiting for content
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'bot' && !lastMessage.text) {
          // Update the empty message with the error
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            text: errorMessage,
          };
          return updated;
        }
        // Otherwise add a new error message
        return [
          ...prev,
          { sender: 'bot', text: errorMessage, interactionId },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setSessionId(uuidv4());
  };

  const CloseButton = () => {
    return (
      <IconButton
        size="small"
        onClick={() => {
          setOpen(false);
          clearConversation();
        }}
      >
        <CloseOutlined fontSize="small" />
      </IconButton>
    );
  };

  // Render the chat UI in a portal to ensure it's not affected by plugin container styles
  const chatContent = (
    <>
      {!open && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed !important',
            bottom: '24px !important',
            right: '24px !important',
            zIndex: 9999,
            bgcolor: theme.palette.primary?.main || '#1976d2',
            color: '#ffffff',
            opacity: 1,
            '&:hover': {
              bgcolor: theme.palette.primary?.dark || '#115293',
            },
            width: 56,
            height: 56,
            boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
            borderRadius: '50%',
          }}
        >
          <ChatBubble />
        </IconButton>
      )}
      {open && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed !important',
            bottom: '24px !important',
            right: '24px !important',
            width: 400,
            height: 600,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">AI Assistant</Typography>
            <Box>
              <Button size="small" onClick={clearConversation}>
                Clear
              </Button>
              <CloseButton />
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {conversation.map((entry, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: entry.sender === 'human' ? 'right' : 'left',
                  mb: 3,
                }}
              >
                {entry.sender === 'human' ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: '#EE0000',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: '80%',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      <strong>{username}:</strong>
                      <MarkdownContent content={entry.text || ''} />
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', mb: 0.5 }}
                    >
                      AI Projects Assistant:
                    </Typography>
                    <MarkdownContent content={entry.text || ''} />
                  </Box>
                )}
              </Box>
            ))}
            {loading && (
              <Box sx={{ textAlign: 'left', mb: 1 }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: '80%',
                  }}
                >
                  <CircularProgress
                    size={16}
                    sx={{ verticalAlign: 'middle' }}
                  />
                </Box>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ p: 1 }}>
            <TextField
              fullWidth
              placeholder="Type a message"
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{ input: { color: theme.palette.text.primary } }}
            />
          </Box>
        </Paper>
      )}
    </>
  );

  // Use a portal to render outside the plugin's container to avoid CSS conflicts
  return ReactDOM.createPortal(
    chatContent,
    document.body
  );
};

export default FloatingChat;
