'use client';

import { useState, useEffect, useRef } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { Send, ExpandMore, ExpandLess, SmartToy, Person } from '@mui/icons-material';
import { fetchAgents, runAgent, Agent, RunResult } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  trace?: RunResult;
}

export default function DemoPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents().then(a => {
      setAgents(a);
      if (a.length) setSelectedId(a[0].id);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRun = async () => {
    const text = input.trim();
    if (!text || !selectedId) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setRunning(true);
    try {
      const result = await runAgent(selectedId, text);
      setMessages(prev => [...prev, { role: 'assistant', content: result.output, trace: result }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: could not reach the agent.' }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Typography variant="h4" fontWeight={700}>Demo</Typography>

      <FormControl fullWidth>
        <InputLabel>Agent</InputLabel>
        <Select
          value={selectedId}
          label="Agent"
          onChange={e => { setSelectedId(e.target.value); setMessages([]); }}
        >
          {agents.map(a => (
            <MenuItem key={a.id} value={a.id}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                <Typography variant="caption" color="text.secondary">{a.model_endpoint}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper
        elevation={0}
        variant="outlined"
        sx={{ display: 'flex', flexDirection: 'column', height: 540 }}
      >
        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary" variant="body2">
                Select an agent and send a message to start.
              </Typography>
            </Box>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <Box
                sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 1 }}
              >
                {msg.role === 'assistant' && (
                  <SmartToy color="action" sx={{ mt: 0.5, fontSize: 20, flexShrink: 0 }} />
                )}
                <Box
                  sx={{
                    maxWidth: '75%',
                    px: 2, py: 1.5,
                    borderRadius: 2,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    border: msg.role === 'user' ? 'none' : '1px solid',
                    borderColor: 'divider',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Box>
                {msg.role === 'user' && (
                  <Person color="action" sx={{ mt: 0.5, fontSize: 20, flexShrink: 0 }} />
                )}
              </Box>

              {/* Trace panel */}
              {msg.trace && (
                <Box sx={{ ml: 4, mt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => setExpandedTrace(expandedTrace === i ? null : i)}
                    endIcon={expandedTrace === i ? <ExpandLess /> : <ExpandMore />}
                    sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'none', px: 0.5 }}
                  >
                    {msg.trace.latency_ms}ms
                    <Chip
                      label={msg.trace.status}
                      size="small"
                      color={msg.trace.status === 'success' ? 'success' : 'error'}
                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                    />
                    {msg.trace.tool_calls.length > 0 && (
                      <Chip
                        label={`${msg.trace.tool_calls.length} tool call${msg.trace.tool_calls.length > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Button>
                  <Collapse in={expandedTrace === i}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, mt: 0.5, maxWidth: 480, bgcolor: 'background.default' }}
                    >
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                        Tool Calls
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          fontSize: '0.7rem',
                          overflow: 'auto',
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5,
                          m: 0,
                          fontFamily: "'Fira Code', monospace",
                          color: 'secondary.main',
                        }}
                      >
                        {JSON.stringify(msg.trace.tool_calls, null, 2)}
                      </Box>
                    </Paper>
                  </Collapse>
                </Box>
              )}
            </div>
          ))}

          {running && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Thinking...</Typography>
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        <Divider />

        {/* Input bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask the agent something..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRun(); } }}
            disabled={running}
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={running || !input.trim() || !selectedId}
            sx={{ minWidth: 48, px: 1.5, alignSelf: 'flex-end' }}
          >
            <Send fontSize="small" />
          </Button>
        </Box>
      </Paper>
    </div>
  );
}
