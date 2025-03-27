import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('portfolios').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const { name, url } = await req.json();
    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('portfolios')
      .insert([{ name, url }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unhandled POST error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('portfolios').delete().eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}