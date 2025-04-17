
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Project, Report } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, Send, ArrowLeft, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormEvent } from 'react';

const ReportForm = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(!!reportId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<Partial<Report>>({
    project_id: projectIdParam || '',
    beneficiary_id: user?.id || '',
    period: 'mensal',
    descricao_progresso: '',
    postos_trabalho: 0,
    status: 'rascunho',
    observacoes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('beneficiary_projects')
          .select('project_id, projects(*)')
          .eq('beneficiary_id', user?.id);

        if (projectsError) throw projectsError;

        const projectsList = projectsData.map((item: any) => item.projects) as Project[];
        setUserProjects(projectsList);

        // If in edit mode, fetch report details
        if (isEditMode && reportId) {
          const { data: reportData, error: reportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .eq('beneficiary_id', user?.id) // Ensure owner access
            .single();

          if (reportError) throw reportError;

          // Only allow editing drafts
          if (reportData.status !== 'rascunho') {
            throw new Error('Apenas relatórios em rascunho podem ser editados');
          }

          setReport(reportData);
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, reportId, isEditMode, projectIdParam]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setReport({ ...report, [name]: name === 'postos_trabalho' ? Number(value) : value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setReport({ ...report, [name]: value });
  };

  const validateForm = () => {
    if (!report.project_id) return 'Selecione um projeto';
    if (!report.period) return 'Selecione um período';
    if (!report.descricao_progresso) return 'Adicione uma descrição do progresso';
    if (report.postos_trabalho === undefined || report.postos_trabalho < 0)
      return 'Informe um número válido de postos de trabalho';
    return null;
  };

  const handleSubmit = async (e: FormEvent, saveAsDraft: boolean = true) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reportData = {
        ...report,
        beneficiary_id: user?.id,
        status: saveAsDraft ? 'rascunho' as const : 'enviado' as const,
        descricao_progresso: report.descricao_progresso || '',
        period: report.period as 'mensal' | 'trimestral' | 'semestral' | 'anual',
        project_id: report.project_id
      };

      let result;
      if (isEditMode && reportId) {
        // Update existing report
        const { data, error } = await supabase
          .from('reports')
          .update(reportData)
          .eq('id', reportId)
          .eq('beneficiary_id', user?.id) // Ensure owner access
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new report
        const { data, error } = await supabase
          .from('reports')
          .insert(reportData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Navigate to the report detail page
      navigate(`/reports/${result.id}`);
    } catch (error: any) {
      console.error('Erro ao salvar relatório:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fgc-600"></div>
      </div>
    );
  }

  if (error && error.includes('Apenas relatórios em rascunho')) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-2">
            <Button variant="outline" onClick={() => navigate('/reports')}>
              Voltar para Relatórios
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button asChild variant="ghost" size="sm" className="mr-2">
          <div onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </div>
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Editar Relatório' : 'Novo Relatório'}
        </h1>
      </div>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, true)}>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Editar Relatório' : 'Preencha os dados do relatório'}</CardTitle>
            <CardDescription>
              Preencha todos os campos obrigatórios. Você pode salvar como rascunho ou enviar para análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="project_id">Projeto *</Label>
              <Select
                name="project_id"
                value={report.project_id}
                onValueChange={(value) => handleSelectChange('project_id', value)}
                disabled={isEditMode || !!projectIdParam || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período do Relatório *</Label>
              <Select
                name="period"
                value={report.period}
                onValueChange={(value) => handleSelectChange('period', value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postos_trabalho">Postos de Trabalho *</Label>
              <Input
                type="number"
                name="postos_trabalho"
                value={report.postos_trabalho || ''}
                onChange={handleInputChange}
                min={0}
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">Informe o número de postos de trabalho gerados ou mantidos.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_progresso">Descrição do Progresso *</Label>
              <Textarea
                name="descricao_progresso"
                value={report.descricao_progresso || ''}
                onChange={handleInputChange}
                rows={6}
                required
                disabled={submitting}
                placeholder="Descreva o progresso do projeto durante este período..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                name="observacoes"
                value={report.observacoes || ''}
                onChange={handleInputChange}
                rows={4}
                disabled={submitting}
                placeholder="Observações adicionais (opcional)..."
              />
            </div>

            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Após o preenchimento, você poderá adicionar fotos e documentos no próximo passo.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/reports')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={submitting}
                className="order-1 sm:order-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button
                type="button"
                className="bg-fgc-600 hover:bg-fgc-700"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, false)}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar para Análise'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ReportForm;
