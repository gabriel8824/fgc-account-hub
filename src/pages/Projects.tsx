
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Project, BeneficiaryProject } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, FolderOpen, Search, FileText, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProjectWithStats extends Project {
  beneficiaryCount?: number;
  reportCount?: number;
}

const Projects = () => {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let projectsData: Project[] = [];

        if (isAdmin) {
          // Admin sees all projects
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('nome');

          if (error) throw error;
          projectsData = data;

          // For admin, also fetch statistics for each project
          const projectsWithStats = await Promise.all(
            projectsData.map(async (project) => {
              // Count beneficiaries for this project
              const { count: beneficiaryCount, error: benefError } = await supabase
                .from('beneficiary_projects')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id);

              if (benefError) throw benefError;

              // Count reports for this project
              const { count: reportCount, error: reportError } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id);

              if (reportError) throw reportError;

              return {
                ...project,
                beneficiaryCount: beneficiaryCount || 0,
                reportCount: reportCount || 0
              };
            })
          );

          setProjects(projectsWithStats);
          setFilteredProjects(projectsWithStats);
        } else {
          // Beneficiary sees only their projects
          const { data: beneficiaryProjectsData, error: benefError } = await supabase
            .from('beneficiary_projects')
            .select('project_id, projects(*)')
            .eq('beneficiary_id', user?.id);

          if (benefError) throw benefError;

          projectsData = beneficiaryProjectsData.map((item: any) => item.projects);

          // For beneficiary, fetch report counts for their projects
          const projectsWithStats = await Promise.all(
            projectsData.map(async (project) => {
              // Count reports for this project by this beneficiary
              const { count: reportCount, error: reportError } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id)
                .eq('beneficiary_id', user?.id);

              if (reportError) throw reportError;

              return {
                ...project,
                reportCount: reportCount || 0
              };
            })
          );

          setProjects(projectsWithStats);
          setFilteredProjects(projectsWithStats);
        }
      } catch (error: any) {
        console.error('Erro ao carregar projetos:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAdmin, user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.nome.toLowerCase().includes(term) ||
          project.descricao.toLowerCase().includes(term) ||
          project.estado.toLowerCase().includes(term)
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

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
            {isAdmin ? 'Todos os Projetos' : 'Meus Projetos'}
          </h1>
          <p className="text-gray-500">
            {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado
            {filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="w-full md:w-auto flex space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar projetos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-1">Nenhum projeto encontrado</h3>
            <p className="text-gray-500 mb-4 text-center">
              {searchTerm.trim() !== ''
                ? `Não encontramos nenhum projeto para "${searchTerm}"`
                : isAdmin
                ? 'Nenhum projeto cadastrado no sistema'
                : 'Você não tem projetos atribuídos'}
            </p>
            {searchTerm.trim() !== '' && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpar Busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-fgc-50 border-b pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.nome}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {project.estado}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-fgc-100 text-fgc-700 border-fgc-200"
                  >
                    ID: {project.id.slice(0, 8)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-sm text-gray-600 line-clamp-3 h-14">{project.descricao}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    {new Date(project.criado_em).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1.5" />
                    {project.reportCount || 0} relatório{(project.reportCount || 0) !== 1 ? 's' : ''}
                  </div>
                  {isAdmin && project.beneficiaryCount !== undefined && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1.5" />
                      {project.beneficiaryCount} beneficiário{project.beneficiaryCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4">
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/projects/${project.id}`}>Ver Detalhes</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
