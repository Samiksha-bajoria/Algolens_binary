import Babel from '@babel/standalone';
try {
  const code = `const Comp = () => <div>Hello</div>;`;
  const result = Babel.transform(code, { filename: 'app.js', presets: [] }).code;
  console.log("SUCCESS:", result);
} catch(e) {
  console.error("ERROR THROWN:", e.toString());
}
