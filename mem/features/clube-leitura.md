---
name: Clube de Leitura
description: Reading clubs feature — groups with shared active book, member progress, club feed, invitations from followed users
type: feature
---
Menu "Clube de Leitura" (/clubes). Tables: clubes_leitura, clube_membros (status pendente/aceito, is_admin), clube_progresso, clube_posts, clube_comentarios.
Only the user's followed users (getFollowingList) can be invited. Creator is auto admin. Only admins can set livro_ativo_id.
Notifications tipos: clube_invite, clube_member, clube_book, clube_post. UserClubesSection appears on Profile and PublicProfile under "Clubes" tab.
Activity timeline includes clube_created, clube_joined, clube_progress, clube_post events.