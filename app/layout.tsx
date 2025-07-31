import './globals.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <div className="min-h-[calc(100vh-69px)]">
              {children}
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 
