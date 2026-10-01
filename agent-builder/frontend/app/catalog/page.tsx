'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { SmartToy, Build, TableChart } from '@mui/icons-material';
import { fetchAgents, fetchTools, fetchTables, Agent, Tool, DataTable } from '@/lib/api';

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Chip label={count} size="small" sx={{ ml: 1 }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
      }}
    >
      <Typography color="text.secondary" variant="body2">{message}</Typography>
    </Box>
  );
}

export default function CatalogPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [tables, setTables] = useState<DataTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAgents(), fetchTools(), fetchTables()])
      .then(([a, t, tb]) => { setAgents(a); setTools(t); setTables(tb); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Typography variant="h4" fontWeight={700}>Catalog</Typography>

      {/* Agents */}
      <section>
        <SectionHeader icon={<SmartToy color="primary" />} title="Agents" count={agents.length} />
        {agents.length === 0 ? (
          <EmptyState message="No agents yet. Create one in Builder." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a, i) => (
              <Card
                key={a.id}
                variant="outlined"
                className={`card-hover fade-up fade-up-${(i % 4) + 1}`}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Typography fontWeight={700} gutterBottom noWrap>{a.name}</Typography>
                  <Chip
                    label={a.model_endpoint}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1.5, maxWidth: '100%', fontSize: '0.65rem' }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1.5,
                      minHeight: 40,
                    }}
                  >
                    {a.description || a.system_prompt || 'No description.'}
                  </Typography>
                  <div className="flex gap-1 flex-wrap">
                    {a.tool_ids.length > 0 && (
                      <Chip label={`${a.tool_ids.length} tool${a.tool_ids.length > 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
                    )}
                    {a.sub_agent_ids.length > 0 && (
                      <Chip label={`${a.sub_agent_ids.length} sub-agents`} size="small" color="secondary" variant="outlined" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* Tools */}
      <section>
        <SectionHeader icon={<Build color="action" />} title="Tools & MCP" count={tools.length} />
        {tools.length === 0 ? (
          <EmptyState message="No tools configured." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t, i) => (
              <Card key={t.id} variant="outlined" className={`card-hover fade-up fade-up-${(i % 4) + 1}`}>
                <CardContent>
                  <div className="flex items-start justify-between mb-2">
                    <Typography fontWeight={700}>{t.name}</Typography>
                    <Chip
                      label={t.type}
                      size="small"
                      color={t.type === 'builtin' ? 'info' : 'warning'}
                      sx={{ ml: 1, flexShrink: 0 }}
                    />
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    {t.description || 'No description.'}
                  </Typography>
                  {t.mcp_url && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={1}
                      sx={{ wordBreak: 'break-all' }}
                    >
                      {t.mcp_url}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* Data Tables */}
      <section>
        <SectionHeader
          icon={<TableChart color="action" />}
          title="Data Tables"
          count={tables.filter(t => !t.isTemporary).length}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables
            .filter(t => !t.isTemporary)
            .map((t, i) => (
              <Card key={t.tableName} variant="outlined" className={`card-hover fade-up fade-up-${(i % 4) + 1}`}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <div className="flex items-center gap-2">
                    <TableChart fontSize="small" color="action" />
                    <Typography fontWeight={700} variant="body2">{t.tableName}</Typography>
                  </div>
                  <Typography variant="caption" color="text.secondary">{t.database}</Typography>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
