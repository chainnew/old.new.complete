='awesome_crawl_output', help='Output directory')
    parser.add_argument('--report', action='store_true', help='Generate markdown report')
    parser.add_argument('--batch-size', type=int, default=20, help='Batch size for AI qualification')
    
    args = parser.parse_args()
    
    # Load MiniMax keys from .env
    from dotenv import load_dotenv
    import os
    load_dotenv()
    
    minimax_keys = [
        os.getenv(f'MINIMAX_API_KEY_{i}')
        for i in range(1, 6)
        if os.getenv(f'MINIMAX_API_KEY_{i}')
    ]
    
    if not minimax_keys:
        logger.warning("No MiniMax API keys found in .env, AI qualification disabled")
    
    # Create crawler
    crawler = AwesomeCrawler(minimax_keys=minimax_keys)
    
    # Parse awesome list inputs
    awesome_lists = []
    for list_str in args.lists:
        parts = list_str.split('/')
        if len(parts) >= 2:
            awesome_lists.append((parts[0], parts[1]))
    
    # Crawl all lists
    results = crawler.crawl_multiple_lists(awesome_lists)
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # Export results
    output_file = output_dir / 'crawl_results.json'
    crawler.export_results(results, str(output_file))
    
    # Generate report if requested
    if args.report:
        report = crawler.generate_report(results)
        report_file = output_dir / 'crawl_report.md'
        with open(report_file, 'w') as f:
            f.write(report)
        logger.info(f"📄 Report saved to {report_file}")
    
    # Print summary
    total_repos = sum(len(repos) for repos in results.values())
    high_quality = sum(1 for repos in results.values() for r in repos if (r.relevance_score or 0) >= 7)
    
    print("\n" + "="*60)
    print("🎉 CRAWL COMPLETE!")
    print("="*60)
    print(f"Total repos found: {total_repos}")
    print(f"High-quality (7+ score): {high_quality}")
    print(f"Output: {output_file}")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
