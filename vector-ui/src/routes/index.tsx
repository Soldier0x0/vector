import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/shell/AppShell';
import { PipelineBuilderPage } from '../components/builder/PipelineBuilderPage';
import { VrlEditorPage } from '../components/vrl/VrlEditorPage';
import { LiveMonitorPage } from '../components/monitor/LiveMonitorPage';
import { TemplateLibraryPage } from '../components/templates/TemplateLibraryPage';
import { AuditLogPage } from '../components/audit/AuditLogPage';
import { useAppStore } from '../stores/appStore';

function BuilderLayout() {
  const pipelineActions = useAppStore((s) => s.pipelineActions);

  return (
    <AppShell
      showPipelineActions
      onValidate={pipelineActions.validate}
      onSave={pipelineActions.save}
    />
  );
}

function DefaultLayout() {
  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<BuilderLayout />}>
        <Route path="/builder" element={<PipelineBuilderPage />} />
      </Route>

      <Route element={<DefaultLayout />}>
        <Route path="/vrl/:transformId" element={<VrlEditorPage />} />
        <Route path="/monitor" element={<LiveMonitorPage />} />
        <Route path="/templates" element={<TemplateLibraryPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/builder" replace />} />
      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}
