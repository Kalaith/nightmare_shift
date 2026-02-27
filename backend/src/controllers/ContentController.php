<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\External\GameContentRepository;

/**
 * Content controller — serves game content data (skills, etc.)
 * These endpoints are public (behind auth middleware) and read-only.
 */
final class ContentController
{
    public function __construct(
        private readonly GameContentRepository $contentRepo
    ) {}

    /**
     * GET /api/v1/content/skills — returns all skill tree definitions.
     */
    public function getSkills(Request $request, Response $response): void
    {
        try {
            $skills = $this->contentRepo->getAllSkills();
            $response->success($skills, 'Skills loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load skills: ' . $e->getMessage(), 500);
        }
    }
}
