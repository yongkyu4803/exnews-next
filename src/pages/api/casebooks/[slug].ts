import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { CasebookContent } from '@/types/casebook'
import { generateSlug, extractPlainText, extractTitleFromFilename, parseDate } from '@/utils/casebookHelpers'

/**
 * 개별 케이스북 상세 API
 * GET /api/casebooks/[slug]
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CasebookContent | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { slug } = req.query

  // slug 유효성 검증
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug parameter' })
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

    // slug와 매칭되는 파일 찾기 (대소문자 무시)
    const targetFile = files.find(filename => {
      const fileSlug = generateSlug(filename)
      return fileSlug.toLowerCase() === slug.toLowerCase()
    })

    if (!targetFile) {
      return res.status(404).json({ error: 'Casebook not found' })
    }

    // 파일 읽기
    const filepath = path.join(casebookDir, targetFile)
    const fileContent = fs.readFileSync(filepath, 'utf-8')

    // gray-matter로 프론트매터 파싱
    const { data, content } = matter(fileContent)

    // 메타데이터 추출 (목록 API와 동일한 로직)
    const fileSlug = generateSlug(targetFile)

    // 제목 추출
    let title = data.title || ''
    if (!title) {
      const h1Match = content.match(/^#\s+(.+)$/m)
      title = h1Match ? h1Match[1] : extractTitleFromFilename(targetFile)
    }

    // 설명 추출
    let description = data.description || ''
    if (!description) {
      // H1 또는 H2 제거 후 첫 문단 추출
      const afterH1 = content.replace(/^#{1,2}\s+.+$/m, '').trim()
      const firstParagraph = afterH1.split('\n\n')[0]
      description = extractPlainText(firstParagraph, 150)
    }

    // 날짜 추출
    let date = data.date || ''
    if (!date) {
      const stats = fs.statSync(filepath)
      date = stats.mtime.toISOString()
    } else {
      date = parseDate(data.date).toISOString()
    }

    // 카테고리 & 태그
    const category = data.category || '규제 케이스북'
    const tags = data.tags || []
    const order = data.order || 999

    return res.status(200).json({
      metadata: {
        slug: fileSlug,
        title,
        description,
        date,
        category,
        tags,
        order,
        filepath: targetFile,
      },
      content, // 마크다운 원본 콘텐츠 반환
    })
  } catch (error) {
    console.error('Error reading casebook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
