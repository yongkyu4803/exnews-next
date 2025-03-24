import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Supabase에서 카테고리 목록 가져오기
      const { data, error } = await supabase
        .from('news')
        .select('category')
        .not('category', 'is', null)
      
      if (error) {
        throw error
      }
      
      // 중복 제거하여 유니크한 카테고리 목록 만들기
      const categorySet = new Set<string>()
      data.forEach(item => {
        if (item.category) categorySet.add(item.category)
      })
      
      const categories = Array.from(categorySet)
      
      res.status(200).json(categories)
    } catch (error: any) {
      // 오류 발생 시 대체 카테고리 반환
      console.error('카테고리 조회 오류:', error.message)
      res.status(200).json(['정치', '경제', '사회', '국제', '문화', '연예/스포츠', '기타'])
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 