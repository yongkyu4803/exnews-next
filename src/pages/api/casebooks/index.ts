import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { CasebookMetadata, CasebooksListResponse } from '@/types/casebook'
import { generateSlug, extractPlainText, extractTitleFromFilename, parseDate } from '@/utils/casebookHelpers'

/**
 * 전체 케이스북 목록 API
 * GET /api/casebooks
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CasebooksListResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // 케이스북 디렉토리 경로
    const casebookDir = path.join(process.cwd(), 'casebook')

    // 디렉토리 존재 확인
    if (!fs.existsSync(casebookDir)) {
      return res.status(404).json({ error: 'Casebook directory not found' })
    }

    // 모든 .md 파일 읽기
    const files = fs.readdirSync(casebookDir).filter(file => file.endsWith('.md'))

    // 각 파일의 메타데이터 추출
    const casebooks: CasebookMetadata[] = files.map(filename => {
      const filepath = path.join(casebookDir, filename)
      const fileContent = fs.readFileSync(filepath, 'utf-8')

      // gray-matter로 프론트매터 파싱
      const { data, content } = matter(fileContent)

      // slug 생성
      const slug = generateSlug(filename)

      // 제목 추출: 프론트매터 > 첫 H1 > 파일명
      let title = data.title || ''
      if (!title) {
        const h1Match = content.match(/^#\s+(.+)$/m)
        title = h1Match ? h1Match[1] : extractTitleFromFilename(filename)
      }

      // 설명 추출: 프론트매터 > 첫 문단
      let description = data.description || ''
      if (!description) {
        // 첫 H1 이후의 첫 문단 추출
        const afterH1 = content.replace(/^#\s+.+$/m, '').trim()
        const firstParagraph = afterH1.split('\n\n')[0]
        description = extractPlainText(firstParagraph, 150)
      }

      // 날짜 추출: 프론트매터 > 파일 수정일
      let date = data.date || ''
      if (!date) {
        const stats = fs.statSync(filepath)
        date = stats.mtime.toISOString()
      } else {
        // 프론트매터의 날짜를 Date 객체로 변환
        date = parseDate(data.date).toISOString()
      }

      // 카테고리 & 태그
      const category = data.category || '규제 케이스북'
      const tags = data.tags || []

      // order 필드 (정렬 순서)
      const order = data.order || 999

      return {
        slug,
        title,
        description,
        date,
        category,
        tags,
        order,
        filepath: filename,
      }
    })

    // 정렬: order 오름차순 → 날짜 내림차순
    casebooks.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return res.status(200).json({
      casebooks,
      totalCount: casebooks.length,
    })
  } catch (error) {
    console.error('Error reading casebooks:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
