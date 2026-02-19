
import React, { useState } from 'react';
import { Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { Card, CardContent, Grid, Chip, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox } from '@material-ui/core';
import StarIcon from '@material-ui/icons/Star';
import EditIcon from '@material-ui/icons/Edit';
import SettingsIcon from '@material-ui/icons/Settings';
import { makeStyles } from '@material-ui/core/styles';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import yaml from 'js-yaml';
import { getAnnotation, isFeatured } from './utils';
import { VoteButtons } from './VoteButtons';
import { VoteRatio } from '../../api/ProjectVotesApi';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  titleRow: {
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  starIcon: {
    color: '#FFD700',
    fontSize: '1.2rem',
  },
  readmeButton: {
    textTransform: 'none',
    minWidth: 'auto',
  },
  editButton: {
    textTransform: 'none',
    minWidth: 'auto',
    marginLeft: theme.spacing(1),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  description: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    lineHeight: 1.5,
  },
  metadataGrid: {
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(2),
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  metadataLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metadataValue: {
    fontSize: '0.875rem',
  },
  ownerName: {
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '150px',
  },
  tagChip: {
    margin: theme.spacing(0.25),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  statusChipContainer: {
    display: 'inline-flex',
  },
  voteContainer: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  internalProjectChip: {
    backgroundColor: '#4caf50',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#45a049',
    },
  },
  externalProjectChip: {
    backgroundColor: '#ff9800',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#fb8c00',
    },
  },
}));

interface ProjectCardProps {
  entity: Entity;
  votes?: VoteRatio;
  onVoteChange?: (votes: VoteRatio) => void;
}

export function ProjectCard({ entity, votes, onVoteChange }: ProjectCardProps) {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState(entity.metadata.title || entity.metadata.name);
  const [editedDescription, setEditedDescription] = useState(entity.metadata.description || '');
  const [editedTags, setEditedTags] = useState((entity.metadata.tags || []).join(', '));
  const [editedCategory, setEditedCategory] = useState(getAnnotation(entity, 'category'));
  const [editedUsecase, setEditedUsecase] = useState(getAnnotation(entity, 'usecase'));
  const [editedOwner, setEditedOwner] = useState(getAnnotation(entity, 'owner'));
  const [editedDomain, setEditedDomain] = useState(getAnnotation(entity, 'domain'));
  const [editedStatus, setEditedStatus] = useState(getAnnotation(entity, 'status'));
  const [editedFeatured, setEditedFeatured] = useState(isFeatured(entity));

  const category = getAnnotation(entity, 'category');
  const usecase = getAnnotation(entity, 'usecase');
  const status = getAnnotation(entity, 'status');
  const owner = getAnnotation(entity, 'owner');
  const domain = getAnnotation(entity, 'domain');
  const featured = isFeatured(entity);

  // Generate a unique project ID from the entity
  const projectId = `${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${entity.metadata.name}`;

  // Show edit button for active projects (not archived/deprecated)
  const showEditButton = status?.toLowerCase() !== 'archived' &&
                          status?.toLowerCase() !== 'deprecated' &&
                          status?.toLowerCase() !== 'deleted';

  // Build formData object with all template parameters
  const formData = {
    projectId: 'jbarea/ai-showcase-test',
    componentPath: `entities/ai/components/${entity.metadata.name}/${entity.metadata.name}.yaml`,
    projectName: entity.metadata.name,
    title: entity.metadata.title || entity.metadata.name,
    description: entity.metadata.description || '',
    tags: entity.metadata.tags || [],
    category: category !== '-' ? category : 'Tool',
    usecase: usecase !== '-' ? usecase : 'Development',
    owner: owner !== '-' ? owner : '',
    domain: domain !== '-' ? domain.toLowerCase() : 'internal',
    status: status !== '-' ? status.toLowerCase() : 'active',
    featured: featured,
    repoType: 'GitLab',
    githubUrl: '',
    gitlabUrl: '',
    gitlabInstance: 'gitlab.cee.redhat.com',
  };

  // Build edit URL - navigate to the edit template with pre-filled form data
  const editUrl = `/create/templates/default/edit-ai-project?formData=${encodeURIComponent(JSON.stringify(formData))}`;

  // Handle save from modal
  const handleSave = async () => {
    setSaving(true);
    try {
      // Generate YAML with updated values
      const tags = editedTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      const componentYaml: any = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: entity.metadata.name,
          title: editedTitle,
          description: editedDescription,
          namespace: entity.metadata.namespace,
          annotations: {
            'ai.redhat.com/category': editedCategory,
            'ai.redhat.com/usecase': editedUsecase,
            'ai.redhat.com/owner': editedOwner,
            'ai.redhat.com/status': editedStatus,
            'ai.redhat.com/domain': editedDomain,
            'ai.redhat.com/featured': editedFeatured ? 'true' : 'false',
            ...entity.metadata.annotations,
          },
        },
        spec: entity.spec || {
          type: 'ai-component',
          lifecycle: 'production',
          owner: 'ai-engineering',
        },
      };

      if (tags.length > 0) {
        componentYaml.metadata.tags = tags;
      }

      const yamlContent = yaml.dump(componentYaml, { lineWidth: -1, noRefs: true });

      // Call backend to save
      const backendUrl = await discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
      const response = await fetchApi.fetch(`${backendUrl}/gitlab/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'jbarea/ai-showcase-test',
          filePath: `entities/ai/components/${entity.metadata.name}/${entity.metadata.name}.yaml`,
          branch: 'main',
          content: yamlContent,
          commitMessage: `Update ${entity.metadata.name}: ${editedTitle}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`);
      }

      alert(`✅ Project updated successfully!\n\nChanges will appear in the catalog within a few minutes.`);
      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`❌ Failed to save changes: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={classes.card}>
      <CardContent>
        {/* Title Row */}
        <Box className={classes.titleRow}>
          <Box className={classes.titleContainer}>
            {featured && <StarIcon className={classes.starIcon} />}
            <Link
              to={`/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${
                entity.metadata.name
              }`}
              className={classes.title}
            >
              {entity.metadata.title || entity.metadata.name}
            </Link>
          </Box>
          <Box className={classes.buttonContainer}>
            <Link
              to={`/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${
                entity.metadata.name
              }/readme`}
            >
              <Button
                variant="outlined"
                size="small"
                className={classes.readmeButton}
              >
                README
              </Button>
            </Link>
            {showEditButton && (
              <>
                <Link to={editUrl}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    className={classes.editButton}
                    startIcon={<EditIcon />}
                  >
                    Edit 1
                  </Button>
                </Link>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  className={classes.editButton}
                  startIcon={<SettingsIcon />}
                  onClick={() => setModalOpen(true)}
                >
                  Edit 2
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Description Row */}
        {entity.metadata.description && (
          <Typography className={classes.description}>
            {entity.metadata.description}
          </Typography>
        )}

        {/* Tags Row */}
        {entity.metadata.tags && entity.metadata.tags.length > 0 && (
          <Box className={classes.chipContainer}>
            {entity.metadata.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                className={classes.tagChip}
              />
            ))}
          </Box>
        )}

        {/* Metadata Grid Row */}
        <Grid container spacing={2} className={classes.metadataGrid}>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Category</Typography>
              <Typography className={classes.metadataValue}>{category}</Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Usecase</Typography>
              <Typography className={classes.metadataValue}>{usecase}</Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Status</Typography>
              <Box className={classes.statusChipContainer}>
                <Chip
                  label={status}
                  size="small"
                  color="default"
                />
              </Box>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className={classes.metadataItem}>
              <Typography className={classes.metadataLabel}>Owner</Typography>
              <Box display="flex" alignItems="center">
                <Typography className={classes.ownerName} title={owner}>
                  {owner}
                </Typography>
                {domain !== '-' && (
                  <Chip
                    label={domain}
                    size="small"
                    className={
                      domain.toLowerCase() === 'internal'
                        ? classes.internalProjectChip
                        : domain.toLowerCase() === 'external'
                        ? classes.externalProjectChip
                        : undefined
                    }
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Box>
            </div>
          </Grid>
        </Grid>

        {/* Vote Buttons */}
        <Box className={classes.voteContainer}>
          <VoteButtons
            projectId={projectId}
            initialVotes={votes}
            onVoteChange={onVoteChange}
          />
        </Box>
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Project: {entity.metadata.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: 8 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                helperText="e.g., ai, testing, automation"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as string)}
                >
                  <MenuItem value="Agent">Agent</MenuItem>
                  <MenuItem value="MCP Server (stdio)">MCP Server (stdio)</MenuItem>
                  <MenuItem value="MCP Server (hosted)">MCP Server (hosted)</MenuItem>
                  <MenuItem value="Tool">Tool</MenuItem>
                  <MenuItem value="Script">Script</MenuItem>
                  <MenuItem value="Framework">Framework</MenuItem>
                  <MenuItem value="Platform">Platform</MenuItem>
                  <MenuItem value="Skill">Skill</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Use Case</InputLabel>
                <Select
                  value={editedUsecase}
                  onChange={(e) => setEditedUsecase(e.target.value as string)}
                >
                  <MenuItem value="Requirements & Design">Requirements & Design</MenuItem>
                  <MenuItem value="Development">Development</MenuItem>
                  <MenuItem value="Testing">Testing</MenuItem>
                  <MenuItem value="Documentation">Documentation</MenuItem>
                  <MenuItem value="Deployment & Monitoring">Deployment & Monitoring</MenuItem>
                  <MenuItem value="Data Analytics">Data Analytics</MenuItem>
                  <MenuItem value="Security & Vulnerability Detection">Security & Vulnerability Detection</MenuItem>
                  <MenuItem value="Process Automation">Process Automation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Owner"
                value={editedOwner}
                onChange={(e) => setEditedOwner(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={editedDomain}
                  onChange={(e) => setEditedDomain(e.target.value as string)}
                >
                  <MenuItem value="internal">Internal</MenuItem>
                  <MenuItem value="external">External</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as string)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editedFeatured}
                    onChange={(e) => setEditedFeatured(e.target.checked)}
                  />
                }
                label="Featured Project"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

