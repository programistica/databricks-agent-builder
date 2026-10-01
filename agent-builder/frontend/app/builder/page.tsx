'use client';

import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { Save, SmartToy, Build, Psychology } from '@mui/icons-material';
import { fetchModels, fetchTools, fetchAgents, createAgent, Agent, Tool } from '@/lib/api';

interface FormState {
  name: string;
  description: string;
  model_endpoint: string;
  system_prompt: string;
  tool_ids: string[];
  sub_agent_ids: string[];
}

export default function BuilderPage() {
  const [models, setModels] = useState<string[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    model_endpoint: '',
    system_prompt: '',
    tool_ids: [],
    sub_agent_ids: [],
  });

  useEffect(() => {
    Promise.all([fetchModels(), fetchTools(), fetchAgents()])
      .then(([m, t, a]) => {
        setModels(m);
        setTools(t);
        setAgents(a);
        if (m.length) setForm(f => ({ ...f, model_endpoint: m[0] }));
      })
      .catch(() => setError('Failed to load resources.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field: 'tool_ids' | 'sub_agent_ids', id: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter(x => x !== id) : [...f[field], id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await createAgent(form);
      setSuccess(true);
      setForm(f => ({ ...f, name: '', description: '', system_prompt: '', tool_ids: [], sub_agent_ids: [] }));
    } catch {
      setError('Failed to create agent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <SmartToy color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>New Agent</Typography>
      </div>

      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Agent created successfully.
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper elevation={0} variant="outlined" className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
            Basic Info
          </Typography>
          <TextField
            label="Agent Name"
            fullWidth
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <FormControl fullWidth required>
            <InputLabel>Model</InputLabel>
            <Select
              value={form.model_endpoint}
              label="Model"
              onChange={e => setForm(f => ({ ...f, model_endpoint: e.target.value }))}
            >
              {models.map(m => (
                <MenuItem key={m} value={m}>
                  <Typography variant="body2">{m}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <Divider />

        {/* System Prompt */}
        <div className="space-y-3">
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
            System Prompt
          </Typography>
          <TextField
            label="System Prompt"
            fullWidth
            multiline
            rows={4}
            value={form.system_prompt}
            onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
            placeholder="You are a helpful assistant..."
          />
        </div>

        {/* Tools */}
        {tools.length > 0 && (
          <>
            <Divider />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Build fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                  Tools
                </Typography>
                {form.tool_ids.length > 0 && (
                  <Chip label={form.tool_ids.length} size="small" color="primary" />
                )}
              </div>
              <FormGroup>
                {tools.map(t => (
                  <FormControlLabel
                    key={t.id}
                    control={
                      <Checkbox
                        checked={form.tool_ids.includes(t.id)}
                        onChange={() => toggle('tool_ids', t.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <div className="flex items-center gap-2">
                          <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                          <Chip
                            label={t.type}
                            size="small"
                            color={t.type === 'builtin' ? 'info' : 'warning'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </div>
                        {t.description && (
                          <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                        )}
                      </Box>
                    }
                    sx={{ mb: 0.5, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                  />
                ))}
              </FormGroup>
            </div>
          </>
        )}

        {/* Sub-Agents */}
        {agents.length > 0 && (
          <>
            <Divider />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Psychology fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                  Sub-Agents
                </Typography>
                {form.sub_agent_ids.length > 0 && (
                  <Chip label={form.sub_agent_ids.length} size="small" color="secondary" />
                )}
              </div>
              <FormGroup>
                {agents.map(a => (
                  <FormControlLabel
                    key={a.id}
                    control={
                      <Checkbox
                        checked={form.sub_agent_ids.includes(a.id)}
                        onChange={() => toggle('sub_agent_ids', a.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.model_endpoint}</Typography>
                      </Box>
                    }
                    sx={{ mb: 0.5, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                  />
                ))}
              </FormGroup>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            Save Agent
          </Button>
        </div>
      </Paper>
    </div>
  );
}
