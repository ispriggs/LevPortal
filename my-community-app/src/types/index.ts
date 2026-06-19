export type User = {
  id: string
  name: string
  avatar?: string
  bio?: string
}

export type Post = {
  id: string
  author: User
  content: string
  createdAt: string
  likes: number
}
