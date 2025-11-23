import json
import psycopg2
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage user contacts and groups
    Args: event with httpMethod (GET), queryStringParameters with user_id
    Returns: HTTP response with contacts and groups list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    user_id = params.get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id is required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT u.id, u.username, u.is_online, m.message_text, m.created_at
            FROM contacts c
            JOIN users u ON c.contact_user_id = u.id
            LEFT JOIN LATERAL (
                SELECT message_text, created_at
                FROM messages
                WHERE (sender_id = %s AND receiver_id = u.id) 
                   OR (sender_id = u.id AND receiver_id = %s)
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON true
            WHERE c.user_id = %s
            ORDER BY m.created_at DESC NULLS LAST
        """, (user_id, user_id, user_id))
        
        contacts_data = cur.fetchall()
        
        contacts = [
            {
                'id': contact[0],
                'name': contact[1],
                'online': contact[2],
                'lastMessage': contact[3] or 'Нет сообщений',
                'time': contact[4].strftime('%H:%M') if contact[4] else '',
                'unread': 0
            }
            for contact in contacts_data
        ]
        
        cur.execute("""
            SELECT g.id, g.name, COUNT(gm.user_id) as members, m.message_text, m.created_at, u.username
            FROM group_members gm
            JOIN groups g ON gm.group_id = g.id
            LEFT JOIN LATERAL (
                SELECT message_text, created_at, sender_id
                FROM messages
                WHERE group_id = g.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON true
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE gm.user_id = %s
            GROUP BY g.id, g.name, m.message_text, m.created_at, u.username
            ORDER BY m.created_at DESC NULLS LAST
        """, (user_id,))
        
        groups_data = cur.fetchall()
        
        groups = [
            {
                'id': group[0],
                'name': group[1],
                'members': group[2],
                'lastMessage': f"{group[5]}: {group[3]}" if group[3] and group[5] else 'Нет сообщений',
                'time': group[4].strftime('%H:%M') if group[4] else '',
                'unread': 0
            }
            for group in groups_data
        ]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'contacts': contacts,
                'groups': groups
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
