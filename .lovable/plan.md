
## Plano: Recuperar Senha e Remover Cadastro Público

### Visão Geral
Simplificar a tela de autenticação removendo o cadastro público (usuários só podem se registrar via convite) e adicionar a opção de recuperação de senha.

---

### 1. Modificar Tela de Login (`src/pages/Auth.tsx`)

**Remover:**
- Componente `Tabs` (não é mais necessário com apenas login)
- Estado e handlers de signup (`signupEmail`, `signupPassword`, `signupNome`, `handleSignup`)
- Aba de cadastro completa

**Adicionar:**
- Estado para controlar modo de recuperação de senha
- Estado para email de recuperação
- Função `handleForgotPassword` usando `supabase.auth.resetPasswordForEmail()`
- Link "Esqueci minha senha" abaixo do botão de login
- Formulário de recuperação (exibido condicionalmente)

**Estrutura Final:**
```text
┌─────────────────────────────────────┐
│            [Logo]                   │
│     Armazenamento Rottas            │
│     Faça login para continuar       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email                       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Senha                       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Entrar              │    │
│  └─────────────────────────────┘    │
│                                     │
│       Esqueci minha senha →         │
└─────────────────────────────────────┘
```

**Ao clicar "Esqueci minha senha":**
```text
┌─────────────────────────────────────┐
│            [Logo]                   │
│     Armazenamento Rottas            │
│     Recuperar sua senha             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email                       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Enviar link de reset     │    │
│  └─────────────────────────────┘    │
│                                     │
│       ← Voltar para login           │
└─────────────────────────────────────┘
```

---

### 2. Detalhes Técnicos

**Função de recuperação de senha:**
```typescript
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(
    recoveryEmail,
    {
      redirectTo: `${window.location.origin}/auth`,
    }
  );

  if (error) {
    toast.error("Erro ao enviar email: " + error.message);
  } else {
    toast.success("Email enviado! Verifique sua caixa de entrada.");
    setShowForgotPassword(false);
  }
  setLoading(false);
};
```

**Novos estados:**
```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [recoveryEmail, setRecoveryEmail] = useState("");
```

---

### 3. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Remover tabs/signup, adicionar recuperação de senha |

---

### 4. Fluxo do Usuário

**Login normal:**
1. Usuário acessa `/auth`
2. Insere email e senha
3. Clica "Entrar"
4. É redirecionado para a página inicial

**Recuperação de senha:**
1. Usuário acessa `/auth`
2. Clica "Esqueci minha senha"
3. Insere o email cadastrado
4. Clica "Enviar link de reset"
5. Recebe email do Supabase com link de redefinição
6. Clica no link e define nova senha
7. Volta para login

**Novo usuário (via convite):**
1. Admin envia convite dentro da plataforma
2. Usuário recebe email com link de cadastro
3. Clica no link que leva para página de cadastro específica (já existente via token)
4. Cria conta e acessa o sistema

---

### Observações

- A URL do email de recuperação será configurada para redirecionar para `/auth`
- O Supabase gerencia automaticamente o email de reset de senha
- O sistema de convites já existente (`InviteUserDialog` + edge function) continuará funcionando normalmente
