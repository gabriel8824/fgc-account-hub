
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Project, Report } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!projectId) throw new Error('ID do projeto não fornecido');

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // For beneficiaries, verify they have access to this project
        if (!isAdmin) {
          const { data: accessData, error: accessError } = await supabase
            .from('beneficiary_projects')
            .select('*')
            .eq('project_id', projectId)
            .eq('beneficiary_id', user?.id)
            .single();

          if (accessError) throw new Error('Você não tem acesso a este projeto');
        }

        // Fetch reports for this project
        const reportQuery = supabase
          .from('reports')
          .select('*')
          .eq('project_id', projectId)
          .order('criado_em', { ascending: false });

        // If not admin, restrict to own reports
        if (!isAdmin) {
          reportQuery.eq('beneficiary_id', user?.id);
        }

        const { data: reportData, error: reportError } = await reportQuery;

        if (reportError) throw reportError;
        setReports(reportData);
      } catch (error: any) {
        console.error('Erro ao carregar projeto:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fgc-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Projeto não encontrado</AlertTitle>
        <AlertDescription>O projeto solicitado não existe ou foi removido.</AlertDescription>
      </Alert>
    );
  }

  // Count reports by status
  const reportStats = {
    draft: reports.filter(r => r.status === 'rascunho').length,
    sent: reports.filter(r => r.status === 'enviado').length,
    approved: reports.filter(r => r.status === 'aprovado').length,
    rejected: reports.filter(r => r.status === 'rejeitado').length,
    total: reports.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.nome}</h1>
          <p className="text-gray-500">
            <Badge variant="outline">{project.estado}</Badge>
          </p>
        </div>
        {!isAdmin && (
          <Button asChild className="bg-fgc-600 hover:bg-fgc-700">
            <Link to={`/reports/new?projectId=${project.id}`}>
              <FileText className="h-4 w-4 mr-2" />
              Novo Relatório
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
              <p className="mt-1">{project.descricao}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Estado</h3>
              <p className="mt-1">{project.estado}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Criado em</h3>
              <p className="mt-1">{new Date(project.criado_em).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-fgc-600 mr-2" />
              <span className="text-2xl font-bold">{reportStats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aguardando Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">{reportStats.sent}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{reportStats.approved}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rejeitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-2xl font-bold">{reportStats.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="py-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Nenhum relatório encontrado para este projeto.</p>
                {!isAdmin && (
                  <Button asChild className="mt-4 bg-fgc-600 hover:bg-fgc-700">
                    <Link to={`/reports/new?projectId=${project.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Relatório
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Relatório {report.period}</p>
                        <div className="text-sm text-gray-500 space-x-2">
                          <span>Postos de trabalho: {report.postos_trabalho}</span>
                          <span>•</span>
                          <span>{new Date(report.criado_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {report.status === 'rascunho' && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                            Rascunho
                          </Badge>
                        )}
                        {report.status === 'enviado' && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                            Enviado
                          </Badge>
                        )}
                        {report.status === 'aprovado' && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            Aprovado
                          </Badge>
                        )}
                        {report.status === 'rejeitado' && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            Rejeitado
                          </Badge>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/reports/${report.id}`}>Ver Detalhes</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
