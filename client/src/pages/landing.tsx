import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Trophy, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card elevation-1 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">IntelliTutor</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="btn-primary">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Master NESA Exams with
              <span className="text-primary"> AI-Powered</span> Practice
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              IntelliTutor uses advanced AI to extract questions from past exam papers, 
              provide intelligent evaluation, and give personalized feedback to accelerate your learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogin} size="lg" className="btn-primary">
                <Brain className="mr-2 h-5 w-5" />
                Start Learning Now
              </Button>
              <Button variant="outline" size="lg" className="btn-outline">
                <BookOpen className="mr-2 h-5 w-5" />
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Advanced AI Technology for Better Learning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge NLP techniques with generative AI 
              to provide the most comprehensive exam preparation experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="stats-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Question Extraction</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">
                  OCR technology extracts questions from PDF exam papers automatically
                </p>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Smart Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">
                  TF-IDF, spaCy, and NLTK analyze your answers for comprehensive feedback
                </p>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Gamified Learning</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">
                  Earn badges and track progress with personalized achievements
                </p>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">
                  AI-powered suggestions based on your performance patterns
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Powered by Advanced NLP & AI
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with state-of-the-art technologies for superior performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "OpenAI GPT-4o", desc: "Generative AI for model answers" },
              { name: "spaCy NLP", desc: "Advanced text processing" },
              { name: "TF-IDF Analysis", desc: "Semantic similarity scoring" },
              { name: "OCR Processing", desc: "PDF & image text extraction" }
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Excel in Your NESA Exams?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of students who are already improving their scores with IntelliTutor
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-white text-primary hover:bg-gray-100">
            <Brain className="mr-2 h-5 w-5" />
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">IntelliTutor</h3>
            <p className="text-muted-foreground mb-4">AI-Powered Educational Excellence</p>
            <p className="text-sm text-muted-foreground">
              © 2024 IntelliTutor. Built by Theoneste NZAKIZWANIMANA - Reg. No: 24RP08786
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
