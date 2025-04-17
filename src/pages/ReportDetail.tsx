
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Report, Project, Attachment, AdminComment } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, CheckCircle, XCircle, Clock, Send, Edit, Trash2, MessageSquare, Image, FileUp, FileCheck, ArrowLeft, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface ExtendedReport extends Report {
  project_name?: string;
}

const ReportStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'rascunho':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Rascunho
        </Badge>
      );
    case 'enviado':
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Enviado
        </Badge>
      );
    case 'aprovado':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    case 'rejeitado':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      );
    default:
      return null;
  }
};

const AttachmentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'foto_projeto':
      return <Image className="h-4 w-4" />;
    case 'comprovante':
      return <FileCheck className="h-4 w-4" />;
    default:
      return <FileUp className="h-4 w-4" />;
  }
};

const ReportDetail = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<ExtendedReport | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [adminComments, setAdminComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        if (!reportId) throw new Error('ID do relatório não fornecido');
        
        // Fetch report details and project name
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*, project:project_id(id, nome, descricao, estado)')
          .eq('id', reportId)
          .single();

        if (reportError) throw reportError;
        
        // For beneficiaries, verify they have access to this report
        if (!isAdmin) {
          if (reportData.beneficiary_id !== user?.id) {
            throw new Error('Você não tem acesso a este relatório');
          }
        }

        const formattedReport: ExtendedReport = {
          ...reportData,
          project_name: reportData.project?.nome
        };
        setReport(formattedReport);
        setProject(reportData.project);
        
        // Fetch attachments
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from('attachments')
          .select('*')
          .eq('report_id', reportId);

        if (attachmentsError) throw attachmentsError;
        setAttachments(attachmentsData);
        
        // Fetch admin comments
        if (isAdmin) {
          const { data: adminCommentsData, error: adminCommentsError } = await supabase
            .from('admin_comments')
            .select('*')
            .eq('report_id', reportId)
            .order('criado_em', { ascending: false });

          if (adminCommentsError) throw adminCommentsError;
          setAdminComments(adminCommentsData);
        }
      } catch (error: any) {
        console.error('Erro ao carregar detalhes do relatório:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [reportId, user, isAdmin]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAdmin || !user) return;
    
    setUpdateLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_comments')
        .insert({
          report_id: reportId!,
          admin_id: user.id,
          comentario: newComment.trim()
        })
        .select();

      if (error) throw error;
      
      // Add new comment to the state
      if (data && data[0]) {
        setAdminComments([data[0], ...adminComments]);
      }
      
      // Close dialog and clear input
      setCommentDialogOpen(false);
      setNewComment('');
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      setUpdateError(error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'aprovado' | 'rejeitado' | 'enviado') => {
    if (!report) return;
    
    setUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;
      
      // Update report status in the state
      setReport({ ...report, status: newStatus });
      
      // Close dialogs
      setApproveDialogOpen(false);
      setRejectDialogOpen(false);
      setSendDialogOpen(false);
    } catch (error: any) {
      console.error(`Erro ao ${newStatus === 'aprovado' ? 'aprovar' : newStatus === 'rejeitado' ? 'rejeitar' : 'enviar'} relatório:`, error);
      setUpdateError(error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!report) return;
    
    setUpdateLoading(true);
    try {
      // Check if there are attachments to delete
      if (attachments.length > 0) {
        // First delete the attachments records
        const { error: attachmentDeleteError } = await supabase
          .from('attachments')
          .delete()
          .eq('report_id', reportId);

        if (attachmentDeleteError) throw attachmentDeleteError;
        
        // Then delete the actual files from storage
        for (const attachment of attachments) {
          const storageRef = attachment.url.replace(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/`, '');
          const { error: storageDeleteError } = await supabase
            .storage
            .from('attachments')
            .remove([storageRef]);
            
          if (storageDeleteError) throw storageDeleteError;
        }
      }
      
      // Then delete admin comments if any
      if (adminComments.length > 0) {
        const { error: commentDeleteError } = await supabase
          .from('admin_comments')
          .delete()
          .eq('report_id', reportId);

        if (commentDeleteError) throw commentDeleteError;
      }
      
      // Finally delete the report
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      // Navigate back to reports list
      navigate('/reports');
    } catch (error: any) {
      console.error('Erro ao excluir relatório:', error);
      setUpdateError(error.message);
    } finally {
      setUpdateLoading(false);
      setDeleteDialogOpen(false);
    }
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

  if (!report || !project) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Relatório não encontrado</AlertTitle>
        <AlertDescription>O relatório solicitado não existe ou foi removido.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm" className="mr-2">
            <Link to="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            Relatório {report.period}
          </h1>
          <ReportStatusBadge status={report.status} />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Beneficiary can edit draft reports */}
          {!isAdmin && report.status === 'rascunho' && (
            <Button asChild variant="outline">
              <Link to={`/reports/edit/${report.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
          
          {/* Beneficiary can send draft reports */}
          {!isAdmin && report.status === 'rascunho' && (
            <>
              <Button onClick={() => setSendDialogOpen(true)} className="bg-fgc-600 hover:bg-fgc-700">
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
              
              <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Relatório</DialogTitle>
                    <DialogDescription>
                      Essa ação enviará o relatório para avaliação do FGC e não poderá ser desfeita.
                      Após o envio, o relatório não poderá mais ser editado.
                    </DialogDescription>
                  </DialogHeader>
                  {updateError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      onClick={() => handleUpdateStatus('enviado')} 
                      className="bg-fgc-600 hover:bg-fgc-700"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Enviando...' : 'Confirmar Envio'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {/* Beneficiary can delete draft reports */}
          {!isAdmin && report.status === 'rascunho' && (
            <>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Relatório</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  {updateError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      onClick={handleDeleteReport}
                      variant="destructive"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Excluindo...' : 'Excluir Permanentemente'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {/* Admin actions for sent reports */}
          {isAdmin && report.status === 'enviado' && (
            <>
              <Button 
                onClick={() => setApproveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              
              <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aprovar Relatório</DialogTitle>
                    <DialogDescription>
                      Deseja aprovar este relatório? 
                      Você pode adicionar comentários antes de aprovar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-2">
                    <Textarea
                      placeholder="Adicionar um comentário (opcional)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  {updateError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      onClick={async () => {
                        if (newComment.trim()) {
                          await handleAddComment();
                        }
                        await handleUpdateStatus('aprovado');
                      }} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Processando...' : 'Confirmar Aprovação'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={() => setRejectDialogOpen(true)}
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              
              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rejeitar Relatório</DialogTitle>
                    <DialogDescription>
                      Deseja rejeitar este relatório? 
                      Por favor, adicione um comentário explicando o motivo da rejeição.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-2">
                    <Textarea
                      placeholder="Motivo da rejeição (obrigatório)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>
                  {updateError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  {newComment.trim() === '' && (
                    <Alert className="my-2 bg-amber-50 text-amber-800 border-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>É necessário adicionar um comentário para rejeitar o relatório.</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      onClick={async () => {
                        if (newComment.trim()) {
                          await handleAddComment();
                          await handleUpdateStatus('rejeitado');
                        }
                      }} 
                      variant="destructive"
                      disabled={updateLoading || newComment.trim() === ''}
                    >
                      {updateLoading ? 'Processando...' : 'Confirmar Rejeição'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {/* Admin can add comments to any report */}
          {isAdmin && (
            <>
              <Button 
                variant="outline"
                onClick={() => setCommentDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Adicionar Comentário
              </Button>
              
              <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Comentário</DialogTitle>
                    <DialogDescription>
                      Adicione um comentário interno sobre este relatório.
                      Apenas administradores podem ver estes comentários.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-2">
                    <Textarea
                      placeholder="Digite seu comentário aqui..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>
                  {updateError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      onClick={handleAddComment}
                      className="bg-fgc-600 hover:bg-fgc-700" 
                      disabled={updateLoading || newComment.trim() === ''}
                    >
                      {updateLoading ? 'Salvando...' : 'Salvar Comentário'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Relatório</CardTitle>
              <CardDescription>
                Projeto: {project.nome} - {project.estado}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Período</h3>
                <p>{report.period}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Postos de Trabalho</h3>
                <p>{report.postos_trabalho}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Descrição do Progresso</h3>
                <p className="whitespace-pre-wrap">{report.descricao_progresso}</p>
              </div>
              {report.observacoes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Observações</h3>
                  <p className="whitespace-pre-wrap">{report.observacoes}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Datas</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Criado em:</span>{' '}
                    {new Date(report.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <span className="text-gray-500">Atualizado em:</span>{' '}
                    {new Date(report.atualizado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Anexos</h2>
            {attachments.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-gray-500">
                  Este relatório não possui anexos.
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="foto_projeto">Fotos do Projeto</TabsTrigger>
                  <TabsTrigger value="comprovante">Comprovantes</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <Card key={attachment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="mr-3 p-2 bg-gray-100 rounded-full">
                                <AttachmentTypeIcon type={attachment.type} />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {attachment.type === 'foto_projeto' ? 'Foto do Projeto' : 'Comprovante'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(attachment.criado_em).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                Visualizar
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="foto_projeto" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.filter(a => a.type === 'foto_projeto').map((attachment) => (
                      <Card key={attachment.id} className="overflow-hidden">
                        <div className="aspect-video w-full overflow-hidden bg-gray-100">
                          <img src={attachment.url} alt="Foto do Projeto" className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-3 flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            {new Date(attachment.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                          <Button asChild variant="outline" size="sm">
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              Ampliar
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {attachments.filter(a => a.type === 'foto_projeto').length === 0 && (
                      <Card className="md:col-span-2">
                        <CardContent className="py-6 text-center text-gray-500">
                          Nenhuma foto do projeto anexada.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="comprovante" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.filter(a => a.type === 'comprovante').map((attachment) => (
                      <Card key={attachment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="mr-3 p-2 bg-gray-100 rounded-full">
                                <FileCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Comprovante</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(attachment.criado_em).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                Visualizar
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {attachments.filter(a => a.type === 'comprovante').length === 0 && (
                      <Card className="md:col-span-2">
                        <CardContent className="py-6 text-center text-gray-500">
                          Nenhum comprovante anexado.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                  {report.status === 'rascunho' && (
                    <>
                      <Clock className="h-8 w-8 text-gray-500 mb-2" />
                      <p className="font-medium text-gray-700">Rascunho</p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Este relatório ainda não foi enviado para análise.
                      </p>
                    </>
                  )}
                  {report.status === 'enviado' && (
                    <>
                      <Clock className="h-8 w-8 text-amber-500 mb-2" />
                      <p className="font-medium text-amber-700">Aguardando Análise</p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Este relatório está aguardando análise do FGC.
                      </p>
                    </>
                  )}
                  {report.status === 'aprovado' && (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                      <p className="font-medium text-green-700">Aprovado</p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Este relatório foi aprovado pela equipe do FGC.
                      </p>
                    </>
                  )}
                  {report.status === 'rejeitado' && (
                    <>
                      <XCircle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="font-medium text-red-700">Rejeitado</p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Este relatório foi rejeitado pela equipe do FGC.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Comentários Internos</CardTitle>
                <CardDescription>
                  Visíveis apenas para administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminComments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum comentário interno</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminComments.map((comment, index) => (
                      <div key={comment.id} className={index !== 0 ? "pt-4 border-t" : ""}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">Comentário do Admin</p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.criado_em).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  onClick={() => setCommentDialogOpen(true)}
                  variant="outline" 
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adicionar Comentário
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/projects/${project.id}`}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Projeto
                </Link>
              </Button>
              
              {/* Only show edit button for beneficiary's draft reports */}
              {!isAdmin && report.status === 'rascunho' && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/reports/edit/${report.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Relatório
                  </Link>
                </Button>
              )}
              
              {/* Send action for beneficiary's draft reports */}
              {!isAdmin && report.status === 'rascunho' && (
                <Button 
                  className="w-full justify-start bg-fgc-600 hover:bg-fgc-700"
                  onClick={() => setSendDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Análise
                </Button>
              )}
              
              {/* Delete action for beneficiary's draft reports */}
              {!isAdmin && report.status === 'rascunho' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Relatório
                </Button>
              )}
              
              {/* Admin actions for sent reports */}
              {isAdmin && report.status === 'enviado' && (
                <>
                  <Button 
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                    onClick={() => setApproveDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Relatório
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar Relatório
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
