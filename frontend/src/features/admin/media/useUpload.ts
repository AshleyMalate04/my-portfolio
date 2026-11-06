import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { ApiError } from '../../../lib/api/client'
import type { AdminMedia } from '../types'
import { useToast } from '../ui/useToast'

/** Carregamento com mensagens de erro do servidor (tipo, tamanho, conteúdo inválido). */
export function useUpload(onUploaded?: (media: AdminMedia) => void) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (file: File) => adminApi.uploadMedia(file),
    onSuccess: (media) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.media })
      toast.success(`Ficheiro "${media.original_name}" carregado.`)
      onUploaded?.(media)
    },
    onError: (error) => {
      const message = error instanceof ApiError ? (error.fieldError('file') ?? error.message) : 'Falha no carregamento.'
      toast.error(message)
    },
  })
}
