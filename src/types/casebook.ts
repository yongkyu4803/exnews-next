/**
 * 케이스북 시스템 타입 정의
 */

export interface CasebookMetadata {
  slug: string
  title: string
  description: string
  date: string
  category?: string
  tags?: string[]
  order?: number
  filepath: string
}

export interface CasebookContent {
  metadata: CasebookMetadata
  content: string
}

export interface CasebooksListResponse {
  casebooks: CasebookMetadata[]
  totalCount: number
}
