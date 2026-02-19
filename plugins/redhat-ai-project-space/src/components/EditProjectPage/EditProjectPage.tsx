import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Header, Content, Progress } from '@backstage/core-components';
import {
  Button,
  TextField,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Typography,
  Chip,
  Box,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { ProjectEditData, generateComponentYAML } from '../../api/GitLabApi';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  buttonGroup: {
    marginTop: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(2),
  },
  tagsInput: {
    marginBottom: theme.spacing(2),
  },
}));

export function EditProjectPage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<ProjectEditData | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        setEditData(data);
      } catch (error) {
        console.error('Failed to parse edit data:', error);
      }
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!editData) return;

    setSaving(true);
    try {
      const yamlContent = generateComponentYAML(editData);
      const backendUrl = await discoveryApi.getBaseUrl('redhat-ai-project-space-backend');

      const response = await fetchApi.fetch(`${backendUrl}/gitlab/file`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: editData.projectId,
          filePath: editData.componentPath,
          branch: 'main',
          content: yamlContent,
          commitMessage: `Update ${editData.projectName}: ${editData.title}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }

      alert('✅ Project updated successfully!\n\nThe changes will appear in the catalog in a few minutes.');
      navigate('/ai-projects');
    } catch (error) {
      console.error('Error saving project:', error);
      alert(`❌ Failed to save project: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !editData) return;

    const newTag = tagInput.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(newTag)) {
      alert('Tags must contain only lowercase letters and numbers');
      return;
    }

    if (!editData.tags?.includes(newTag)) {
      setEditData({
        ...editData,
        tags: [...(editData.tags || []), newTag],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      tags: editData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  if (!editData) {
    return (
      <Page themeId="tool">
        <Header title="Edit AI Project" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title={`Edit Project: ${editData.projectName}`} />
      <Content>
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>

          <TextField
            fullWidth
            label="Project Title"
            value={editData.title || ''}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className={classes.formControl}
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className={classes.formControl}
            multiline
            rows={4}
            required
          />

          <Box className={classes.tagsInput}>
            <TextField
              fullWidth
              label="Add Tag (lowercase letters and numbers only)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              helperText="Press Enter to add tag"
            />
            {editData.tags && editData.tags.length > 0 && (
              <Box mt={1}>
                {editData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    style={{ margin: 4 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Paper>

        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            AI Project Metadata
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Category"
                value={editData.category || ''}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className={classes.formControl}
                required
              >
                <MenuItem value="Agent">Agent</MenuItem>
                <MenuItem value="MCP Server (stdio)">MCP Server (stdio)</MenuItem>
                <MenuItem value="MCP Server (hosted)">MCP Server (hosted)</MenuItem>
                <MenuItem value="Tool">Tool</MenuItem>
                <MenuItem value="Script">Script</MenuItem>
                <MenuItem value="Framework">Framework</MenuItem>
                <MenuItem value="Platform">Platform</MenuItem>
                <MenuItem value="Skill">Skill</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Use Case"
                value={editData.usecase || ''}
                onChange={(e) => setEditData({ ...editData, usecase: e.target.value })}
                className={classes.formControl}
                required
              >
                <MenuItem value="Requirements & Design">Requirements & Design</MenuItem>
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Documentation">Documentation</MenuItem>
                <MenuItem value="Deployment & Monitoring">Deployment & Monitoring</MenuItem>
                <MenuItem value="Data Analytics">Data Analytics</MenuItem>
                <MenuItem value="Security & Vulnerability Detection">Security & Vulnerability Detection</MenuItem>
                <MenuItem value="Process Automation">Process Automation</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Team"
                value={editData.owner || ''}
                onChange={(e) => setEditData({ ...editData, owner: e.target.value })}
                className={classes.formControl}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Domain"
                value={editData.domain || 'internal'}
                onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                className={classes.formControl}
                required
              >
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="external">External</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={editData.status || 'active'}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className={classes.formControl}
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl className={classes.formControl}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editData.featured || false}
                      onChange={(e) => setEditData({ ...editData, featured: e.target.checked })}
                    />
                  }
                  label="Featured on AI Portal"
                />
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Repository Information
          </Typography>

          <TextField
            fullWidth
            select
            label="Repository Type"
            value={editData.repoType || 'GitLab'}
            onChange={(e) => setEditData({ ...editData, repoType: e.target.value as 'GitHub' | 'GitLab' })}
            className={classes.formControl}
          >
            <MenuItem value="GitHub">GitHub</MenuItem>
            <MenuItem value="GitLab">GitLab</MenuItem>
          </TextField>

          {editData.repoType === 'GitHub' && (
            <TextField
              fullWidth
              label="GitHub URL"
              value={editData.githubUrl || ''}
              onChange={(e) => setEditData({ ...editData, githubUrl: e.target.value })}
              className={classes.formControl}
              placeholder="https://github.com/owner/repo"
            />
          )}

          {editData.repoType === 'GitLab' && (
            <>
              <TextField
                fullWidth
                label="GitLab URL"
                value={editData.gitlabUrl || ''}
                onChange={(e) => setEditData({ ...editData, gitlabUrl: e.target.value })}
                className={classes.formControl}
                placeholder="https://gitlab.cee.redhat.com/owner/repo"
              />
              <TextField
                fullWidth
                label="GitLab Instance"
                value={editData.gitlabInstance || 'gitlab.cee.redhat.com'}
                onChange={(e) => setEditData({ ...editData, gitlabInstance: e.target.value })}
                className={classes.formControl}
              />
            </>
          )}
        </Paper>

        <Box className={classes.buttonGroup}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/ai-projects')}
            disabled={saving}
          >
            Cancel
          </Button>
        </Box>
      </Content>
    </Page>
  );
}
