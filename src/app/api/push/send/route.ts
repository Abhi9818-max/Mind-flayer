import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:support@mindflayer.app',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, title, body: messageBody, url, tag } = body;

        if (!userId || !title || !messageBody) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, title, body' },
                { status: 400 }
            );
        }

        // Get all push subscriptions for the user
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (subError) {
            console.error('Error fetching subscriptions:', subError);
            return NextResponse.json(
                { error: 'Failed to fetch subscriptions' },
                { status: 500 }
            );
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json(
                { message: 'No subscriptions found for user' },
                { status: 200 }
            );
        }

        // Prepare notification payload
        const payload = JSON.stringify({
            title,
            body: messageBody,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: tag || 'notification',
            data: {
                url: url || '/notifications',
                timestamp: Date.now(),
            },
            requireInteraction: false,
        });

        // Send push notification to all subscriptions
        const sendPromises = subscriptions.map(async (sub) => {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                await webpush.sendNotification(pushSubscription, payload);
                return { success: true, endpoint: sub.endpoint };
            } catch (error: any) {
                console.error('Error sending push to endpoint:', sub.endpoint, error);

                // If subscription is invalid (410 Gone), delete it
                if (error.statusCode === 410) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', sub.id);
                }

                return { success: false, endpoint: sub.endpoint, error: error.message };
            }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            total: subscriptions.length,
            results,
        });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
