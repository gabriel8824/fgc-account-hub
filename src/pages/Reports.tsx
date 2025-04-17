
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Report, Project } from '@/types/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, PlusCircle, ChevronDown, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExtendedReport extends Report {
  project_name?: string;
}

const ReportStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'rascunho':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap">
          <Clock className="h-3 w-3 mr-1" />
          Rascunho
        </Badge>
      );
    case 'enviado':
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 whitespace-nowrap">
          <Clock className="h-3 w-3 mr-1" />
          Enviado
        </Badge>
      );
    case 'aprovado':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 whitespace-nowrap">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    case 'rejeitado':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 whitespace-nowrap">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      );
    default:
      return null;
  }
};

const Reports = () => {
  const { isAdmin, user } = useAuth();
  const [reports, setReports] = useState<ExtendedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ExtendedReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let query = supabase.from('reports').select('*, project:project_id(id, nome)');

        if (!isAdmin) {
          // Beneficiaries only see their own reports
          query = query.eq('beneficiary_id', user?.id);
        }

        const { data, error } = await query.order('criado_em', { ascending: false });

        if (error) throw error;

        // Transform the data to match our expected format
        const formattedReports: ExtendedReport[] = data.map((report: any) => ({
          ...report,
          project_name: report.project?.nome || 'Projeto Desconhecido'
        }));

        setReports(formattedReports);
        setFilteredReports(formattedReports);

        // Fetch available projects for filtering
        if (isAdmin) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .order('nome');
          
          if (projectsError) throw projectsError;
          setProjects(projectsData);
        } else {
          const { data: benefProjectsData, error: benefProjectsError } = await supabase
            .from('beneficiary_projects')
            .select('project_id, projects(*)')
            .eq('beneficiary_id', user?.id);
          
          if (benefProjectsError) throw benefProjectsError;
          
          const benefProjects = benefProjectsData.map((item: any) => item.projects);
          setProjects(benefProjects);
        }
      } catch (error: any) {
        console.error('Erro ao carregar relatórios:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAdmin, user]);

  useEffect(() => {
    // Apply all filters
    let filtered = reports;

    // Text search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.project_name?.toLowerCase().includes(term) ||
          report.descricao_progresso.toLowerCase().includes(term) ||
          (report.observacoes && report.observacoes.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Period filter
    if (periodFilter !== 'all') {
      filtered = filtered.filter((report) => report.period === periodFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((report) => report.project_id === projectFilter);
    }

    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, periodFilter, projectFilter, reports]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPeriodFilter('all');
    setProjectFilter('all');
  };

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Todos os Relatórios' : 'Meus Relatórios'}
          </h1>
          <p className="text-gray-500">
            {filteredReports.length} relatório{filteredReports.length !== 1 ? 's' : ''} encontrado
            {filteredReports.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="w-full md:w-auto flex items-center space-x-2">
          {!isAdmin && (
            <Button asChild className="bg-fgc-600 hover:bg-fgc-700">
              <Link to="/reports/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Relatório
              </Link>
            </Button>
          )}
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar relatórios..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                Filtros
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-gray-500">Status</DropdownMenuLabel>
                <DropdownMenuItem 
                  className={statusFilter === 'all' ? 'bg-gray-100' : ''}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={statusFilter === 'rascunho' ? 'bg-gray-100' : ''}
                  onClick={() => setStatusFilter('rascunho')}
                >
                  Rascunho
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={statusFilter === 'enviado' ? 'bg-gray-100' : ''}
                  onClick={() => setStatusFilter('enviado')}
                >
                  Enviado
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={statusFilter === 'aprovado' ? 'bg-gray-100' : ''}
                  onClick={() => setStatusFilter('aprovado')}
                >
                  Aprovado
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={statusFilter === 'rejeitado' ? 'bg-gray-100' : ''}
                  onClick={() => setStatusFilter('rejeitado')}
                >
                  Rejeitado
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-gray-500">Período</DropdownMenuLabel>
                <DropdownMenuItem 
                  className={periodFilter === 'all' ? 'bg-gray-100' : ''}
                  onClick={() => setPeriodFilter('all')}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={periodFilter === 'mensal' ? 'bg-gray-100' : ''}
                  onClick={() => setPeriodFilter('mensal')}
                >
                  Mensal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={periodFilter === 'trimestral' ? 'bg-gray-100' : ''}
                  onClick={() => setPeriodFilter('trimestral')}
                >
                  Trimestral
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={periodFilter === 'semestral' ? 'bg-gray-100' : ''}
                  onClick={() => setPeriodFilter('semestral')}
                >
                  Semestral
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={periodFilter === 'anual' ? 'bg-gray-100' : ''}
                  onClick={() => setPeriodFilter('anual')}
                >
                  Anual
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-gray-500">Projeto</DropdownMenuLabel>
                <DropdownMenuItem 
                  className={projectFilter === 'all' ? 'bg-gray-100' : ''}
                  onClick={() => setProjectFilter('all')}
                >
                  Todos os Projetos
                </DropdownMenuItem>
                {projects.map((project) => (
                  <DropdownMenuItem 
                    key={project.id}
                    className={projectFilter === project.id ? 'bg-gray-100' : ''}
                    onClick={() => setProjectFilter(project.id)}
                  >
                    {project.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                onClick={resetFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active filters display */}
      {(statusFilter !== 'all' || periodFilter !== 'all' || projectFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-500">Filtros ativos:</span>
          
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => setStatusFilter('all')} 
              />
            </Badge>
          )}
          
          {periodFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center">
              Período: {periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => setPeriodFilter('all')} 
              />
            </Badge>
          )}
          
          {projectFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center">
              Projeto: {projects.find(p => p.id === projectFilter)?.nome?.substring(0, 15) || 'Desconhecido'}
              {(projects.find(p => p.id === projectFilter)?.nome?.length || 0) > 15 && '...'}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => setProjectFilter('all')} 
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 hover:text-gray-700 p-1 h-auto font-normal"
            onClick={resetFilters}
          >
            Limpar todos
          </Button>
        </div>
      )}

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-1">Nenhum relatório encontrado</h3>
            <p className="text-gray-500 mb-4 text-center">
              {(searchTerm.trim() !== '' || statusFilter !== 'all' || periodFilter !== 'all' || projectFilter !== 'all')
                ? 'Não encontramos relatórios que correspondam aos filtros aplicados'
                : isAdmin
                ? 'Nenhum relatório cadastrado no sistema'
                : 'Você não tem relatórios cadastrados'}
            </p>
            {(searchTerm.trim() !== '' || statusFilter !== 'all' || periodFilter !== 'all' || projectFilter !== 'all') && (
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
            )}
            {!isAdmin && reports.length === 0 && (
              <Button asChild className="mt-4 bg-fgc-600 hover:bg-fgc-700">
                <Link to="/reports/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Criar Primeiro Relatório
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{report.project_name}</h3>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Relatório {report.period}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Postos de trabalho: {report.postos_trabalho}</span>
                      <span>Data: {new Date(report.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{report.descricao_progresso}</p>
                  </div>
                  <div className="flex items-center space-x-2 md:flex-shrink-0">
                    <ReportStatusBadge status={report.status} />
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
    </div>
  );
};

export default Reports;
