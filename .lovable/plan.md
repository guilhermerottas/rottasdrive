
## Tela de Splash Nativa para Mobile

Criar uma tela de splash screen que aparece por 3 segundos apenas no mobile, simulando a abertura de um app nativo. A tela terá fundo branco, o logo centralizado e uma barra de loading preta.

### Comportamento
- Aparece **apenas no mobile** (tela menor que 768px)
- Exibida por **3 segundos** enquanto os dados carregam em segundo plano
- Transicao suave de fade-out ao desaparecer
- Aparece apenas **uma vez por sessao** (usando sessionStorage para nao repetir ao navegar)

### Visual
- Fundo branco
- Logo `src/assets/logo.png` centralizado verticalmente e horizontalmente
- Barra de progresso preta abaixo do logo, preenchendo gradualmente ao longo dos 3 segundos

### Detalhes Tecnicos

**Novo componente: `src/components/MobileSplashScreen.tsx`**
- Estado interno controlando visibilidade e progresso da barra
- `useEffect` com intervalo para animar a barra de 0% a 100% em 3 segundos
- Fade-out ao completar
- Verifica `sessionStorage` para nao exibir novamente na mesma sessao
- Usa `useIsMobile()` para detectar se e mobile

**Alteracao em `src/App.tsx`**
- Importar e renderizar `MobileSplashScreen` como overlay no topo da arvore de componentes
- O app continua carregando normalmente por tras da splash screen
