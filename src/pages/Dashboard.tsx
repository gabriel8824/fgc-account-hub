
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Project, Report } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, CheckCircle, XCircle, Clock, FolderOpen, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const BeneficiaryDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch beneficiary's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('beneficiary_projects')
          .select('project_id, projects(*)')
          .eq('beneficiary_id', user?.id);

        if (projectsError) throw projectsError;

        const projectsList = projectsData.map((item: any) => item.projects) as Project[];
        setProjects(projectsList);

        // Fetch beneficiary's reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('beneficiary_id', user?.id)
          .order('criado_em', { ascending: false });

        if (reportsError) throw reportsError;

        setReports(reportsData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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

  // Count reports by status
  const reportStats = {
    draft: reports.filter(r => r.status === 'rascunho').length,
    sent: reports.filter(r => r.status === 'enviado').length,
    approved: reports.filter(r => r.status === 'aprovado').length,
    rejected: reports.filter(r => r.status === 'rejeitado').length,
    total: reports.length
  };

  // Get recent reports
  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Bem-vindo ao Portal do Beneficiário</h1>
        <Button asChild className="bg-fgc-600 hover:bg-fgc-700">
          <Link to="/reports/new">
            <FileText className="h-4 w-4 mr-2" />
            Novo Relatório
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 text-fgc-600 mr-2" />
              <span className="text-2xl font-bold">{projects.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Relatórios Enviados</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Relatórios Aprovados</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Relatórios Rejeitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-2xl font-bold">{reportStats.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Meus Projetos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios Recentes</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="py-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Você não possui projetos atribuídos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-fgc-50 border-b">
                    <CardTitle>{project.nome}</CardTitle>
                    <CardDescription className="truncate">{project.estado}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{project.descricao}</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/projects/${project.id}`}>Ver Detalhes</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="reports" className="py-4">
          {recentReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Nenhum relatório encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Período: {report.period}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {report.status === 'rascunho' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Rascunho
                          </span>
                        )}
                        {report.status === 'enviado' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Enviado
                          </span>
                        )}
                        {report.status === 'aprovado' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </span>
                        )}
                        {report.status === 'rejeitado' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeitado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button asChild variant="outline" size="sm" className="text-xs">
                        <Link to={`/reports/${report.id}`}>Ver Relatório</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {reports.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button asChild variant="outline">
                    <Link to="/reports">Ver Todos os Relatórios</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    beneficiaries: 0,
    projects: 0,
    reports: {
      draft: 0,
      sent: 0,
      approved: 0,
      rejected: 0,
      total: 0
    }
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Count beneficiaries (profiles with role = 'beneficiary')
        const { count: beneficiaryCount, error: benefError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'beneficiary');

        if (benefError) throw benefError;

        // Count projects
        const { count: projectCount, error: projError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        if (projError) throw projError;

        // Count reports by status
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('status');

        if (reportError) throw reportError;

        const reportStats = {
          draft: reportData.filter(r => r.status === 'rascunho').length,
          sent: reportData.filter(r => r.status === 'enviado').length,
          approved: reportData.filter(r => r.status === 'aprovado').length,
          rejected: reportData.filter(r => r.status === 'rejeitado').length,
          total: reportData.length
        };

        // Fetch recent reports
        const { data: recentReportsData, error: recentError } = await supabase
          .from('reports')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        setStats({
          beneficiaries: beneficiaryCount || 0,
          projects: projectCount || 0,
          reports: reportStats
        });

        setRecentReports(recentReportsData);
      } catch (error: any) {
        console.error('Error fetching admin data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Beneficiários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-fgc-600 mr-2" />
              <span className="text-2xl font-bold">{stats.beneficiaries}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 text-fgc-600 mr-2" />
              <span className="text-2xl font-bold">{stats.projects}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-fgc-600 mr-2" />
              <span className="text-2xl font-bold">{stats.reports.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendentes de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">{stats.reports.sent}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Relatórios</CardTitle>
            <CardDescription>Distribuição do status de todos os relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    <span>Enviados</span>
                  </div>
                  <span className="font-medium">{stats.reports.sent}</span>
                </div>
                <Progress value={(stats.reports.sent / stats.reports.total) * 100} className="h-2 bg-gray-200" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Aprovados</span>
                  </div>
                  <span className="font-medium">{stats.reports.approved}</span>
                </div>
                <Progress value={(stats.reports.approved / stats.reports.total) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <span>Rejeitados</span>
                  </div>
                  <span className="font-medium">{stats.reports.rejected}</span>
                </div>
                <Progress value={(stats.reports.rejected / stats.reports.total) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-gray-400 mr-2"></div>
                    <span>Rascunhos</span>
                  </div>
                  <span className="font-medium">{stats.reports.draft}</span>
                </div>
                <Progress value={(stats.reports.draft / stats.reports.total) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Relatórios Recentes</CardTitle>
              <CardDescription>Últimos relatórios enviados</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/reports">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum relatório recente</p>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">Relatório {report.period}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <p>{new Date(report.criado_em).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.status === 'rascunho' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          Rascunho
                        </span>
                      )}
                      {report.status === 'enviado' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                          Enviado
                        </span>
                      )}
                      {report.status === 'aprovado' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Aprovado
                        </span>
                      )}
                      {report.status === 'rejeitado' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Rejeitado
                        </span>
                      )}
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link to={`/reports/${report.id}`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-6">
        <Button asChild variant="outline" className="bg-white">
          <Link to="/reports">
            <FileText className="h-4 w-4 mr-2" />
            Gerenciar Relatórios
          </Link>
        </Button>
        <Button asChild className="bg-fgc-600 hover:bg-fgc-700">
          <Link to="/statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Estatísticas Detalhadas
          </Link>
        </Button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fgc-600"></div>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <BeneficiaryDashboard />;
};

export default Dashboard;
