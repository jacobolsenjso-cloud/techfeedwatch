export async function GET() {
  // Opretter dags dato og lægger præcis 1 år til
  const expireDate = new Date();
  expireDate.setFullYear(expireDate.getFullYear() + 1);

  const content = `Contact: mailto:info@techfeedwatch.com
Expires: ${expireDate.toISOString()}
Preferred-Languages: en`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}